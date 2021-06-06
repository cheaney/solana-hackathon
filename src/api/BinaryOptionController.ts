import {Program} from "@project-serum/anchor";
import {
    Token,
    TOKEN_PROGRAM_ID,
    MintLayout, AccountLayout
} from '@solana/spl-token';
import {WalletAdapter} from "../wallet-adapters";
import {
    Connection,
    PublicKey,
    SystemProgram,
    Account,
    SYSVAR_RENT_PUBKEY, SystemInstruction, Keypair, SYSVAR_CLOCK_PUBKEY
} from "@solana/web3.js";
import {Buffer} from "buffer";
import BN from "bn.js";
import moment from "moment";
import {Market} from "./model/Market";
import {CreateMarketRequest} from "./model/CreateMarketRequest";
import { pythMap } from "./storage/pyth";
import {MakeOfferRequest} from "./model/MakeOfferRequest";
import {Offer} from "./model/Offer";
import {Position} from "./model/Position";

const SYSVAR_RECENT_BLOCKHASHES_PUBKEY = new PublicKey(
    'SysvarRecentB1ockHashes11111111111111111111',
);

const OPTION_CONTRACT_PROGRAM_ID : PublicKey = new PublicKey(
    '86gFWuvuGe2AzHzEw7xw5CEEshtpw2fj1Q7JB9gSsZsr',
);

const createProgramAddress = async (publicKey: PublicKey) : Promise<[PublicKey, BN]> => {
    let programAddress: PublicKey;
    const nonce = new BN(0);
    while (true) {
        try {
            programAddress = await PublicKey.createProgramAddress(
                [publicKey.toBuffer(), nonce.toArrayLike(Buffer, 'le', 8)],
                OPTION_CONTRACT_PROGRAM_ID
            );
            break;
        } catch (e) {
            nonce.iaddn(1);
        }
    }
    return [programAddress, nonce];
};

export async function createMarket(
    program: Program,
    wallet: WalletAdapter,
    connection: Connection,
    request: CreateMarketRequest
) : Promise<[string, PublicKey]> {
    await connection.getBalance(wallet.publicKey);

    const marketContractAccount = new Keypair();
    const createMarketContactIx = await program.account.market.createInstruction(marketContractAccount);

    const yesMint = new Account();
    const [yesMintAuthorityPDA, yesMintAuthorityNonce] = await createProgramAddress(yesMint.publicKey);
    const createYesMintAccountIx = SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: yesMint.publicKey,
        lamports: await Token.getMinBalanceRentForExemptMint(connection),
        space: MintLayout.span,
        programId: TOKEN_PROGRAM_ID
    });
    const initYesMintIx = Token.createInitMintInstruction(
        TOKEN_PROGRAM_ID,
        yesMint.publicKey,
        9,
        yesMintAuthorityPDA,
        null
    );

    const noMint = new Keypair();
    const [noMintAuthorityPDA, noMintAuthorityNonce] = await createProgramAddress(noMint.publicKey);
    const createNoMintAccountIx = SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: noMint.publicKey,
        lamports: await Token.getMinBalanceRentForExemptMint(connection),
        space: MintLayout.span,
        programId: TOKEN_PROGRAM_ID
    });
    const initNoMintIx = Token.createInitMintInstruction(
        TOKEN_PROGRAM_ID,
        noMint.publicKey,
        9,
        noMintAuthorityPDA,
        null
    );

    const nonceAccount = new Keypair();
    const product = pythMap[request.symbol].productAccount;
    const price = pythMap[request.symbol].priceAccount;
    const value = request.value.mul(new BN(10 ** pythMap[request.symbol].exponent));
    const greaterThan = request.condition === "Above";
    const start = new BN(request.date.startOf("day").unix());
    const end = new BN(request.date.endOf("day").unix());

    const createMarketInstructions = [
        createYesMintAccountIx,
        initYesMintIx,
        createNoMintAccountIx,
        initNoMintIx,
        createMarketContactIx,
    ];

    const createMarketTx = await program.rpc.createMarket(
        yesMintAuthorityNonce,
        noMintAuthorityNonce,
        product,
        price,
        greaterThan,
        value,
        start,
        end,
        {
            accounts: {
                market: marketContractAccount.publicKey,
                creator: wallet.publicKey,
                rent: SYSVAR_RENT_PUBKEY,
                recentBlockhashes: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
                yesMint: yesMint.publicKey,
                noMint: noMint.publicKey,
                nonceAccount: nonceAccount.publicKey,
                systemProgram: SystemProgram.programId
            },
            signers: [
                marketContractAccount,
                yesMint,
                noMint,
                nonceAccount,
            ],
            instructions: createMarketInstructions
        }
    );
    return [createMarketTx, marketContractAccount.publicKey];
}

export async function makeOffer(
    program: Program,
    wallet: WalletAdapter,
    connection: Connection,
    request: MakeOfferRequest
) : Promise<[string, PublicKey]> {
    const instructions : SystemInstruction[] = [];
    const marketOfferAccount = new Account();

    const nonceAccountKey = new PublicKey(request.market.nonceAccount);
    const marketPublicKey = new PublicKey(request.market.key);
    // if bet amount is 1, total amount should be 10. If bet amount is 21, total amount should be 100
    const totalAmount = new BN(Math.pow(10, Math.floor(Math.log10(request.amount.toNumber())) + 1));

    const betAccount = new Keypair();
    const betAccountMintKey = request.outcome === 'Yes'
        ? new PublicKey(request.market.yesMint) : new PublicKey(request.market.noMint);
    const createBetAccountIx = SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: betAccount.publicKey,
        lamports: await Token.getMinBalanceRentForExemptAccount(connection),
        space: AccountLayout.span,
        programId: TOKEN_PROGRAM_ID
    });
    instructions.push(createBetAccountIx);
    const initCreatorYesAccount = Token.createInitAccountInstruction(
        TOKEN_PROGRAM_ID,
        betAccountMintKey,
        betAccount.publicKey,
        wallet.publicKey
    );
    instructions.push(initCreatorYesAccount);

    const createOfferIx = await program.account.offer.createInstruction(marketOfferAccount);
    instructions.push(createOfferIx);

    const makeOfferIx = await program.rpc.makeOffer(
        request.amount.mul(new BN(10**9)),
        totalAmount.mul(new BN(10**9)),
        request.outcome === 'Yes',
        {
            accounts: {
                systemProgram: SystemProgram.programId,
                offer: marketOfferAccount.publicKey,
                market: marketPublicKey,
                rent: SYSVAR_RENT_PUBKEY,
                creator: wallet.publicKey,
                betAccount: betAccount.publicKey,
                nonceAccount: nonceAccountKey,
            },
            signers: [
                marketOfferAccount,
                betAccount
            ],
            instructions
        }
    );
    return [makeOfferIx, marketOfferAccount.publicKey];
}

export async function takeOffer(
    program: Program,
    wallet: WalletAdapter,
    connection: Connection,
    market: Market,
    offer: Offer
) : Promise<string> {
    const instructions : SystemInstruction[] = [];

    const takerBetAccount = new Keypair();
    const takerBetAccountMint = offer.outcome === 'Yes'
        ? market.noMint : market.yesMint;
    const createBetAccountIx = SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: takerBetAccount.publicKey,
        lamports: await Token.getMinBalanceRentForExemptAccount(connection),
        space: AccountLayout.span,
        programId: TOKEN_PROGRAM_ID
    });
    instructions.push(createBetAccountIx);
    const initCreatorYesAccount = Token.createInitAccountInstruction(
        TOKEN_PROGRAM_ID,
        takerBetAccountMint,
        takerBetAccount.publicKey,
        wallet.publicKey
    );
    instructions.push(initCreatorYesAccount);

    let accounts = {
        systemProgram: SystemProgram.programId,
        offer: offer.key,
        market: market.key,
        creator: offer.creator,
        taker: wallet.publicKey,
        nonceAccount: market.nonceAccount,
        creatorBetMint: offer.outcome === 'Yes' ? market.yesMint : market.noMint,
        creatorBetMintAuthority: offer.outcome === 'Yes' ? market.yesMintAuthority : market.noMintAuthority,
        creatorBetTokenAccount: offer.creatorBetAccount,
        takerBetMint: offer.outcome === 'Yes' ? market.noMint : market.yesMint,
        takerBetMintAuthority: offer.outcome === 'Yes' ? market.noMintAuthority : market.yesMintAuthority,
        takerBetTokenAccount: takerBetAccount.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
    };

    return await program.rpc.takeOffer({
        accounts: accounts,
        signers: [
            takerBetAccount,
        ],
        instructions,
    });
}

export async function cancelOffer(
    program: Program,
    offer: Offer,
    market: Market
) : Promise<string> {
    return await program.rpc.cancelOffer(
        {
            accounts: {
                systemProgram: SystemProgram.programId,
                recentBlockhashes: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
                rent: SYSVAR_RENT_PUBKEY,
                offer: offer.key,
                nonceAccount: market.nonceAccount,
                nonceAccountAuthority: market.nonceAccountAuthority,
                creator: offer.creator,
                market: market.key,
            }
        }
    );
}

export async function settleMarket(
    program: Program,
    wallet: WalletAdapter,
    market: Market
) : Promise<string> {
    return await program.rpc.settleMarket({
        accounts: {
            market: market.key,
            settler: wallet.publicKey,
            clock: SYSVAR_CLOCK_PUBKEY,
            price: market.price,
        },
    });
}

export async function withdrawFromMarket(
    program: Program,
    wallet: WalletAdapter,
    position: Position
) : Promise<string> {
    return await program.rpc.withdraw({
        accounts: {
            market: position.market.key,
            offer: position.offer.key,
            withdrawer: wallet.publicKey,
            rent: SYSVAR_RENT_PUBKEY,
            systemProgram: SystemProgram.programId,
            recentBlockhashes: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
            nonceAccount: position.market.nonceAccount,
            nonceAccountAuthority: position.market.nonceAccountAuthority,
            betTokenAccount: position.betAccount,
            betTokenMint: position.betAccountMint,
            tokenProgram: TOKEN_PROGRAM_ID,
        },
    });
}

export async function withdrawCreatorFee(
    program: Program,
    wallet: WalletAdapter,
    market: Market
) : Promise<string> {
    return await program.rpc.withdrawCreatorFee({
        accounts: {
            market: market.key,
            withdrawer: wallet.publicKey,
            rent: SYSVAR_RENT_PUBKEY,
            systemProgram: SystemProgram.programId,
            recentBlockhashes: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
            nonceAccount: market.nonceAccount,
            nonceAccountAuthority: market.nonceAccountAuthority,
        },
    });
}

export async function withdrawSettlerFee(
    program: Program,
    wallet: WalletAdapter,
    market: Market
) : Promise<string> {
    return await program.rpc.withdrawSettlerFee({
        accounts: {
            market: market.key,
            withdrawer: wallet.publicKey,
            rent: SYSVAR_RENT_PUBKEY,
            systemProgram: SystemProgram.programId,
            recentBlockhashes: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
            nonceAccount: market.nonceAccount,
            nonceAccountAuthority: market.nonceAccountAuthority,
        },
    });
}