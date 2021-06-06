use anchor_lang::prelude::*;
use solana_program::{
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    clock::{ Clock },
    program::{invoke},
    system_instruction,
    nonce,
};
use bytemuck;
use anchor_spl::token::{ self, Transfer, MintTo, Burn };
use spl_token::state::{ Account, Mint};
use spl_token::solana_program::program_pack::Pack;
use borsh::{BorshDeserialize, BorshSerialize};
use pyth_client;

#[program]
mod binary_options {
    use super::*;
    use spl_token::solana_program::program_pack::IsInitialized;
    use solana_program::program::invoke_signed;

    pub fn create_market(
        ctx: Context<CreateMarket>,
        yes_mint_authority_nonce: u64,
        no_mint_authority_nonce: u64,
        product: Pubkey,
        price: Pubkey,
        greater_than: bool,
        value: i64,
        start: i64,
        end: i64,
    ) -> ProgramResult {
        let market = &mut ctx.accounts.market;
        market.state = MarketState {
            collateral: 0,
            yes_tokens: 0,
            no_tokens: 0,
            status: MarketStatus::Open,
            result: Outcome::Undecided,
        };
        market.condition = Condition {
            product,
            price,
            operator: if greater_than { ConditionOperator::GreaterThan } else { ConditionOperator::LessThan },
            value,
            start,
            end,
        };
        market.creator = *ctx.accounts.creator.key;

        let (nonce_account_authority, nonce_account_nonce) = Pubkey::find_program_address(&[ctx.accounts.nonce_account.key.as_ref()], ctx.program_id);
        let init_nonce_account_txs = system_instruction::create_nonce_account(
            &market.creator,
            &ctx.accounts.nonce_account.key,
            &nonce_account_authority,
            ctx.accounts.rent.minimum_balance(nonce::State::size()),
        );
        invoke(
            &init_nonce_account_txs[0],
            &[
                ctx.accounts.system_program.clone(),
                ctx.accounts.creator.clone(),
                ctx.accounts.nonce_account.clone(),
            ]
        )?;
        invoke(
            &init_nonce_account_txs[1],
            &[
                ctx.accounts.rent.to_account_info().clone(),
                ctx.accounts.recent_blockhashes.clone(),
                ctx.accounts.nonce_account.clone(),
                ctx.accounts.system_program.clone(),
            ]
        )?;

        market.nonce_account = *ctx.accounts.nonce_account.key;
        market.nonce_account_authority = nonce_account_authority;
        market.nonce_account_authority_nonce = nonce_account_nonce;

        let yes_mint = Mint::unpack(&ctx.accounts.yes_mint.data.borrow())?;
        if !yes_mint.is_initialized {
            msg!("Yes Mint Not Initialized");
            return Err(ProgramError::UninitializedAccount);
        }
        let yes_mint_pda = Pubkey::create_program_address(
            &[ctx.accounts.yes_mint.key.as_ref(), bytemuck::bytes_of(&yes_mint_authority_nonce)],
            ctx.program_id
        )?;
        if yes_mint.mint_authority.unwrap() != yes_mint_pda {
            msg!("Program was not authority of yes mint");
            return Err(ProgramError::InvalidAccountData);
        }
        market.yes_mint = *ctx.accounts.yes_mint.key;
        market.yes_mint_authority_nonce = yes_mint_authority_nonce;
        market.yes_mint_authority = yes_mint_pda;

        let no_mint = Mint::unpack(&ctx.accounts.no_mint.data.borrow())?;
        if !no_mint.is_initialized {
            msg!("No Mint Not Initialized");
            return Err(ProgramError::UninitializedAccount);
        }
        let no_mint_pda = Pubkey::create_program_address(
            &[ctx.accounts.no_mint.key.as_ref(), bytemuck::bytes_of(&no_mint_authority_nonce)],
            ctx.program_id
        )?;
        if no_mint.mint_authority.unwrap() != no_mint_pda {
            msg!("Program was not authority of no mint");
            return Err(ProgramError::InvalidAccountData);
        }
        market.no_mint = *ctx.accounts.no_mint.key;
        market.no_mint_authority_nonce = no_mint_authority_nonce;
        market.no_mint_authority = no_mint_pda;

        market.fees.creator_fee_numerator = 10;
        market.fees.creator_fee_denominator = 1000;
        market.fees.settler_fee_numerator = 10;
        market.fees.settler_fee_denominator = 1000;
        market.fees.settler_withdrew = false;
        market.fees.creator_withdrew = false;
        Ok(())
    }

    pub fn make_offer(ctx: Context<MakeOffer>, bet_amount: u64, total_amount: u64, yes_outcome: bool) -> ProgramResult {
        let offer = &mut ctx.accounts.offer;
        offer.status = OfferStatus::Open;
        offer.market = *ctx.accounts.market.to_account_info().key;
        offer.bet_amount = bet_amount;
        offer.total_amount = total_amount;
        offer.creator = *ctx.accounts.creator.key;
        offer.outcome = if yes_outcome { Outcome::Yes } else { Outcome::No };
        offer.creator_bet_account = *ctx.accounts.bet_account.key;
        offer.creator_withdrew = false;
        offer.taker_withdrew = false;

        invoke(
            &system_instruction::transfer(&offer.creator,  ctx.accounts.nonce_account.key, offer.bet_amount),
            &[
                ctx.accounts.creator.to_account_info().clone(),
                ctx.accounts.nonce_account.to_account_info().clone(),
                ctx.accounts.system_program.to_account_info().clone(),
            ],
        )?;

        Ok(())
    }

    pub fn take_offer(ctx: Context<TakeOffer>) -> ProgramResult {
        let offer = &mut ctx.accounts.offer;
        match offer.status {
            OfferStatus::Filled => return Err(ErrorCode::OfferAlreadyFilled.into()),
            OfferStatus::Canceled => return Err(ErrorCode::OfferAlreadyCanceled.into()),
            _ => (),
        }

        offer.status = OfferStatus::Filled;
        offer.taker = *ctx.accounts.taker.key;
        offer.taker_bet_account = *ctx.accounts.taker_bet_token_account.key;

        let market = &mut ctx.accounts.market;
        market.state.collateral += offer.total_amount;
        let new_yes_tokens = if let Outcome::Yes = offer.outcome { offer.bet_amount} else { offer.total_amount - offer.bet_amount };
        let new_no_tokens = if let Outcome::Yes = offer.outcome { offer.total_amount - offer.bet_amount} else { offer.bet_amount };
        market.state.yes_tokens += new_yes_tokens;
        market.state.no_tokens += new_no_tokens;

        invoke(
            &system_instruction::transfer(&offer.taker,  ctx.accounts.nonce_account.key, offer.total_amount - offer.bet_amount),
            &[
                ctx.accounts.taker.to_account_info().clone(),
                ctx.accounts.nonce_account.to_account_info().clone(),
                ctx.accounts.system_program.to_account_info().clone(),
            ],
        )?;

        msg!("Here");
        let mint = if let Outcome::Yes = offer.outcome {market.yes_mint} else {market.no_mint};
        let nonce = if let Outcome::Yes = offer.outcome {market.yes_mint_authority_nonce} else {market.no_mint_authority_nonce};
        let mint_signature_seeds = [mint.as_ref(), bytemuck::bytes_of(&nonce)];
        let signers = &[&mint_signature_seeds[..]];
        let cpi_accounts = MintTo {
            mint: ctx.accounts.creator_bet_mint.clone(),
            to: ctx.accounts.creator_bet_token_account.clone(),
            authority: ctx.accounts.creator_bet_mint_authority.clone(),
        };
        let cpi_program = ctx.accounts.token_program.clone();
        let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signers);
        token::mint_to(cpi_context, offer.bet_amount)?;

        msg!("Here2");
        let mint = if let Outcome::Yes = offer.outcome {market.no_mint} else {market.yes_mint};
        let nonce = if let Outcome::Yes = offer.outcome {market.no_mint_authority_nonce} else {market.yes_mint_authority_nonce};
        let mint_signature_seeds = [mint.as_ref(), bytemuck::bytes_of(&nonce)];
        let signers = &[&mint_signature_seeds[..]];
        let cpi_accounts = MintTo {
            mint: ctx.accounts.taker_bet_mint.clone(),
            to: ctx.accounts.taker_bet_token_account.clone(),
            authority: ctx.accounts.taker_bet_mint_authority.clone(),
        };
        let cpi_program = ctx.accounts.token_program.clone();
        let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signers);
        token::mint_to(cpi_context, offer.total_amount - offer.bet_amount)?;

        Ok(())
    }

    pub fn cancel_offer(ctx: Context<CancelOffer>) -> ProgramResult {
        let offer = &mut ctx.accounts.offer;
        match offer.status {
            OfferStatus::Filled => return Err(ErrorCode::OfferAlreadyFilled.into()),
            OfferStatus::Canceled => return Err(ErrorCode::OfferAlreadyCanceled.into()),
            _ => (),
        }
        offer.status = OfferStatus::Canceled;

        let market = &ctx.accounts.market;
        let signature_seeds = [market.nonce_account.as_ref(), &[market.nonce_account_authority_nonce]];
        let signers = &[&signature_seeds[..]];
        invoke_signed(
            &system_instruction::withdraw_nonce_account(ctx.accounts.nonce_account.key, &market.nonce_account_authority, &offer.creator, offer.bet_amount),
            &[
                ctx.accounts.nonce_account.clone(),
                ctx.accounts.nonce_account_authority.to_account_info().clone(),
                ctx.accounts.creator.to_account_info().clone(),
                ctx.accounts.system_program.to_account_info().clone(),
                ctx.accounts.recent_blockhashes.to_account_info().clone(),
                ctx.accounts.rent.to_account_info().clone(),
            ],
            signers
        )?;

        Ok(())
    }

    pub fn settle_market(ctx: Context<SettleMarket>) -> ProgramResult {
        let market = &mut ctx.accounts.market;
        if let MarketStatus::Settled = market.state.status {
            return Err(ErrorCode::MarketAlreadySettled.into());
        }

        let clock = Clock::from_account_info(&ctx.accounts.clock)?;
        if clock.unix_timestamp.lt(&market.condition.start) {
            return Err(ErrorCode::TooEarlyToSettle.into());
        }

        if clock.unix_timestamp.gt(&market.condition.end) {
            market.settler = *ctx.accounts.settler.key;
            market.state.status = MarketStatus::Settled;
            market.state.result = Outcome::No;
            return Ok(())
        }

        let price_data = &ctx.accounts.price.try_borrow_data()?;
        let price = pyth_client::cast::<pyth_client::Price>(price_data).agg.price;

        if let ConditionOperator::GreaterThan = market.condition.operator {
            if price > market.condition.value {
                market.settler = *ctx.accounts.settler.key;
                market.state.status = MarketStatus::Settled;
                market.state.result = Outcome::Yes;
                return Ok(())
            }
        }

        if let ConditionOperator::LessThan = market.condition.operator {
            if price < market.condition.value {
                market.settler = *ctx.accounts.settler.key;
                market.state.status = MarketStatus::Settled;
                market.state.result = Outcome::Yes;
                return Ok(())
            }
        }

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> ProgramResult {
        let market = &mut ctx.accounts.market;
        let offer = &mut ctx.accounts.offer;
        if let Outcome::Undecided = market.state.result {
            return Err(ErrorCode::MarketNotSettled.into());
        }

        let withdrawer = &ctx.accounts.withdrawer;
        let mut withdraw_amount: u64 = 0;

        if (offer.creator == *withdrawer.key) {
            if (offer.creator_withdrew) {
                return Err(ErrorCode::AccountAlreadyWithdrew.into())
            }
            offer.creator_withdrew = true;
        } else if (offer.taker == *withdrawer.key) {
            if (offer.taker_withdrew) {
                return Err(ErrorCode::AccountAlreadyWithdrew.into())
            }
            offer.taker_withdrew = true;
        } else {
            return Err(ErrorCode::AccountNotAllowedToWithdraw.into())
        }

        let bet_token_account = Account::unpack(&ctx.accounts.bet_token_account.data.borrow())?;
        if bet_token_account.amount > 0 {
            if let Outcome::Yes = market.state.result {
                if bet_token_account.mint == market.yes_mint {
                    let numerator = market.state.collateral as u128;
                    let denominator = (bet_token_account.amount as u128) / (market.state.yes_tokens as u128);
                    withdraw_amount += (numerator / denominator) as u64;
                }
            }

            if let Outcome::No = market.state.result {
                if bet_token_account.mint == market.no_mint {
                    let numerator = market.state.collateral as u128;
                    let denominator = (bet_token_account.amount as u128) / (market.state.no_tokens as u128);
                    withdraw_amount += (numerator / denominator) as u64;
                }
            }
        }

        let burn_cpi_accounts = Burn {
            mint: ctx.accounts.bet_token_mint.clone(),
            to: ctx.accounts.bet_token_account.clone(),
            authority: withdrawer.clone(),
        };
        let burn_cpi_program = ctx.accounts.token_program.clone();
        let burn_cpi_context = CpiContext::new(burn_cpi_program, burn_cpi_accounts);
        token::burn(burn_cpi_context, bet_token_account.amount)?;

        let signature_seeds = [market.nonce_account.as_ref(), &[market.nonce_account_authority_nonce]];
        let signers = &[&signature_seeds[..]];
        invoke_signed(
            &system_instruction::withdraw_nonce_account(ctx.accounts.nonce_account.key, &market.nonce_account_authority, withdrawer.key, withdraw_amount),
            &[
                ctx.accounts.nonce_account.clone(),
                ctx.accounts.nonce_account_authority.to_account_info().clone(),
                ctx.accounts.withdrawer.to_account_info().clone(),
                ctx.accounts.system_program.to_account_info().clone(),
                ctx.accounts.recent_blockhashes.to_account_info().clone(),
                ctx.accounts.rent.to_account_info().clone(),
            ],
            signers
        )?;

        Ok(())
    }

    pub fn withdraw_creator_fee(ctx: Context<WithdrawCreatorFee>) -> ProgramResult {
        let market = &mut ctx.accounts.market;
        let withdrawer = &ctx.accounts.withdrawer;
        if market.creator != *withdrawer.key {
            return Err(ErrorCode::WithdrawerNotCreator.into());
        }

        if market.fees.creator_withdrew {
            return Err(ErrorCode::CreatorFeeAlreadyWithdrawn.into());
        }

        market.fees.creator_withdrew = true;

        let creator_fee = market.state.collateral * market.fees.creator_fee_numerator / market.fees.creator_fee_denominator;
        let signature_seeds = [market.nonce_account.as_ref(), &[market.nonce_account_authority_nonce]];
        let signers = &[&signature_seeds[..]];
        invoke_signed(
            &system_instruction::withdraw_nonce_account(ctx.accounts.nonce_account.key, &market.nonce_account_authority, withdrawer.key, creator_fee),
            &[
                ctx.accounts.nonce_account.clone(),
                ctx.accounts.nonce_account_authority.to_account_info().clone(),
                ctx.accounts.withdrawer.to_account_info().clone(),
                ctx.accounts.system_program.to_account_info().clone(),
                ctx.accounts.recent_blockhashes.to_account_info().clone(),
                ctx.accounts.rent.to_account_info().clone(),
            ],
            signers
        )?;

        Ok(())
    }

    pub fn withdraw_settler_fee(ctx: Context<WithdrawSettlerFee>) -> ProgramResult {
        let market = &mut ctx.accounts.market;
        let withdrawer = &ctx.accounts.withdrawer;
        if market.settler != *withdrawer.key {
            return Err(ErrorCode::WithdrawerNotSettler.into());
        }

        if market.fees.settler_withdrew {
            return Err(ErrorCode::SettlerFeeAlreadyWithdrawn.into());
        }

        market.fees.settler_withdrew = true;

        let settler_fee = market.state.collateral * market.fees.settler_fee_numerator / market.fees.settler_fee_denominator;
        let signature_seeds = [market.nonce_account.as_ref(), &[market.nonce_account_authority_nonce]];
        let signers = &[&signature_seeds[..]];
        invoke_signed(
            &system_instruction::withdraw_nonce_account(ctx.accounts.nonce_account.key, &market.nonce_account_authority, withdrawer.key, settler_fee),
            &[
                ctx.accounts.nonce_account.clone(),
                ctx.accounts.nonce_account_authority.to_account_info().clone(),
                ctx.accounts.withdrawer.to_account_info().clone(),
                ctx.accounts.system_program.to_account_info().clone(),
                ctx.accounts.recent_blockhashes.to_account_info().clone(),
                ctx.accounts.rent.to_account_info().clone(),
            ],
            signers
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateMarket<'info> {
    pub system_program: AccountInfo<'info>,
    #[account(init)]
    pub market: ProgramAccount<'info, Market>,
    pub rent: Sysvar<'info, Rent>,
    pub recent_blockhashes: AccountInfo<'info>,
    pub creator: AccountInfo<'info>,
    #[account(signer,mut)]
    pub nonce_account: AccountInfo<'info>,
    pub yes_mint: AccountInfo<'info>,
    pub no_mint: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct MakeOffer<'info> {
    pub system_program: AccountInfo<'info>,
    #[account(init)]
    pub offer: ProgramAccount<'info, Offer>,
    pub rent: Sysvar<'info, Rent>,
    pub market: AccountInfo<'info>,
    #[account(mut)]
    pub nonce_account: AccountInfo<'info>,
    #[account(signer)]
    pub creator: AccountInfo<'info>,
    pub bet_account: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct TakeOffer<'info> {
    pub system_program: AccountInfo<'info>,
    #[account(mut)]
    pub offer: ProgramAccount<'info, Offer>,
    #[account(mut)]
    pub market: ProgramAccount<'info, Market>,
    #[account(signer,mut)]
    pub taker: AccountInfo<'info>,
    pub creator: AccountInfo<'info>,
    #[account(mut)]
    pub nonce_account: AccountInfo<'info>,
    #[account(mut)]
    pub creator_bet_mint: AccountInfo<'info>,
    pub creator_bet_mint_authority: AccountInfo<'info>,
    #[account(mut)]
    pub creator_bet_token_account: AccountInfo<'info>,
    #[account(mut)]
    pub taker_bet_mint: AccountInfo<'info>,
    pub taker_bet_mint_authority: AccountInfo<'info>,
    #[account(mut)]
    pub taker_bet_token_account: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct CancelOffer<'info> {
    pub system_program: AccountInfo<'info>,
    pub market: ProgramAccount<'info, Market>,
    pub rent: Sysvar<'info, Rent>,
    pub recent_blockhashes: AccountInfo<'info>,
    #[account(mut)]
    pub offer: ProgramAccount<'info, Offer>,
    #[account(signer,mut)]
    pub creator: AccountInfo<'info>,
    #[account(mut)]
    pub nonce_account: AccountInfo<'info>,
    pub nonce_account_authority: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct SettleMarket<'info> {
    #[account(mut)]
    pub market: ProgramAccount<'info, Market>,
    pub settler: AccountInfo<'info>,
    pub clock: AccountInfo<'info>,
    pub price: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    pub system_program: AccountInfo<'info>,
    #[account(mut)]
    pub market: ProgramAccount<'info, Market>,
    #[account(mut)]
    pub offer: ProgramAccount<'info, Offer>,
    pub rent: Sysvar<'info, Rent>,
    pub recent_blockhashes: AccountInfo<'info>,
    #[account(signer, mut)]
    pub withdrawer: AccountInfo<'info>,
    #[account(mut)]
    pub nonce_account: AccountInfo<'info>,
    pub nonce_account_authority: AccountInfo<'info>,
    #[account(mut)]
    pub bet_token_mint: AccountInfo<'info>,
    #[account(mut)]
    pub bet_token_account: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct WithdrawCreatorFee<'info> {
    pub system_program: AccountInfo<'info>,
    #[account(mut)]
    pub market: ProgramAccount<'info, Market>,
    pub rent: Sysvar<'info, Rent>,
    pub recent_blockhashes: AccountInfo<'info>,
    #[account(signer, mut)]
    pub withdrawer: AccountInfo<'info>,
    #[account(mut)]
    pub nonce_account: AccountInfo<'info>,
    pub nonce_account_authority: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct WithdrawSettlerFee<'info> {
    pub system_program: AccountInfo<'info>,
    #[account(mut)]
    pub market: ProgramAccount<'info, Market>,
    pub rent: Sysvar<'info, Rent>,
    pub recent_blockhashes: AccountInfo<'info>,
    #[account(signer, mut)]
    pub withdrawer: AccountInfo<'info>,
    #[account(mut)]
    pub nonce_account: AccountInfo<'info>,
    pub nonce_account_authority: AccountInfo<'info>,
}

#[account]
pub struct Market {
    pub state: MarketState,
    pub condition: Condition,
    pub creator: Pubkey,
    pub settler: Pubkey,
    pub nonce_account: Pubkey,
    pub nonce_account_authority: Pubkey,
    pub nonce_account_authority_nonce: u8,
    pub yes_mint: Pubkey,
    pub yes_mint_authority: Pubkey,
    pub yes_mint_authority_nonce: u64,
    pub no_mint: Pubkey,
    pub no_mint_authority: Pubkey,
    pub no_mint_authority_nonce: u64,
    pub fees: Fees,
}

#[derive(Clone, BorshSerialize, BorshDeserialize)]
pub struct Condition {
    pub product: Pubkey,
    pub price: Pubkey,
    pub operator: ConditionOperator,
    pub value: i64,
    pub start: i64,
    pub end: i64,
}

#[derive(Clone, BorshSerialize, BorshDeserialize)]
pub enum ConditionOperator {
    GreaterThan,
    LessThan,
}

#[account]
pub struct Offer {
    pub market: Pubkey,
    pub creator: Pubkey,
    pub taker: Pubkey,
    pub outcome: Outcome,
    pub status: OfferStatus,
    pub bet_amount: u64,
    pub total_amount: u64,
    pub creator_bet_account: Pubkey,
    pub taker_bet_account: Pubkey,
    pub creator_withdrew: bool,
    pub taker_withdrew: bool,
}

#[derive(Clone, BorshSerialize, BorshDeserialize)]
pub enum OfferStatus {
    Open,
    Filled,
    Canceled,
}

#[derive(Clone, BorshSerialize, BorshDeserialize)]
pub enum Outcome {
    Yes,
    No,
    Undecided,
}

#[derive(Clone, BorshSerialize, BorshDeserialize)]
pub struct MarketState {
    pub collateral: u64,
    pub yes_tokens: u64,
    pub no_tokens: u64,
    pub status: MarketStatus,
    pub result: Outcome,
}

#[derive(Clone, BorshSerialize, BorshDeserialize)]
pub enum MarketStatus {
    Open,
    Settled,
}

#[derive(Clone, BorshSerialize, BorshDeserialize)]
pub struct Fees {
    pub creator_fee_numerator: u64,
    pub creator_fee_denominator: u64,
    pub settler_fee_numerator: u64,
    pub settler_fee_denominator: u64,
    pub creator_withdrew: bool,
    pub settler_withdrew: bool,
}

#[error]
pub enum ErrorCode {
    #[msg("Too early to settle")]
    TooEarlyToSettle,
    #[msg("Market not settled")]
    MarketNotSettled,
    #[msg("Market already settled")]
    MarketAlreadySettled,
    #[msg("Offer already filled")]
    OfferAlreadyFilled,
    #[msg("Offer already canceled")]
    OfferAlreadyCanceled,
    #[msg("Withdrawer already withdrew")]
    AccountAlreadyWithdrew,
    #[msg("Withdrawer not allowed")]
    AccountNotAllowedToWithdraw,
    #[msg("Withdrawer not creator")]
    WithdrawerNotCreator,
    #[msg("Creator fee already withdrawn")]
    CreatorFeeAlreadyWithdrawn,
    #[msg("Withdrawer not settler")]
    WithdrawerNotSettler,
    #[msg("Settler fee already withdrawn")]
    SettlerFeeAlreadyWithdrawn,
}
