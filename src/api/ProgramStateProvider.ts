import {Program} from "@project-serum/anchor";
import moment from "moment";
import {pythPriceAccountToSymbol} from "./storage/pyth";
import {ProgramState} from "./model/ProgramState";
import {Offer} from "./model/Offer";
import {Position} from "./model/Position";
import BN from "bn.js";
import {PublicKey} from "@solana/web3.js";

let cachedProgramState : ProgramState = getEmptyProgramState();
export async function getProgramState(program: Program, bypassCache: boolean = false) : Promise<ProgramState>{
    if (cachedProgramState.key !== -1 && !bypassCache) return cachedProgramState;

    const marketAccounts = await program.account.market.all();
    const offerAccounts = await program.account.offer.all();

    cachedProgramState = getEmptyProgramState();
    cachedProgramState.key = Math.floor(Math.random() * 10000);
    marketAccounts.forEach(marketAccount => {
        cachedProgramState.markets[marketAccount.publicKey.toString()] = {
            key: marketAccount.publicKey,
            creator: marketAccount.account.creator,
            settler: marketAccount.account.settler,
            outcome: marketAccount.account.state.result['yes']
                ? 'Yes' : (marketAccount.account.state.result['no'] ? 'No' : 'Undecided'),
            symbol: pythPriceAccountToSymbol[marketAccount.account.condition.price.toString()],
            date: moment.unix(marketAccount.account.condition.start.toNumber()),
            value: marketAccount.account.condition.value,
            condition: marketAccount.account.condition.operator['lessThan'] ? 'Below' : 'Above',
            collateral: marketAccount.account.state.collateral,
            yesTokens: marketAccount.account.state.yesTokens,
            noTokens: marketAccount.account.state.noTokens,
            yesMint: marketAccount.account.yesMint,
            yesMintAuthority: marketAccount.account.yesMintAuthority,
            noMint: marketAccount.account.noMint,
            noMintAuthority: marketAccount.account.noMintAuthority,
            nonceAccount: marketAccount.account.nonceAccount,
            nonceAccountAuthority: marketAccount.account.nonceAccountAuthority,
            offers: {},
            status: marketAccount.account.state.status['open'] ? 'Open' : 'Settled',
            price: marketAccount.account.condition.price,
            creatorWithdrew: marketAccount.account.fees.creatorWithdrew,
            settlerWithdrew: marketAccount.account.fees.settlerWithdrew,
        }
    });

    offerAccounts.forEach(offerAccount => {
        const offer: Offer = {
            key: offerAccount.publicKey,
            creator: offerAccount.account.creator,
            taker: offerAccount.account.taker,
            creatorBetAccount: offerAccount.account.creatorBetAccount,
            takerBetAccount: offerAccount.account.takerBetAccount,
            market: offerAccount.account.market,
            betAmount: offerAccount.account.betAmount,
            totalAmount: offerAccount.account.totalAmount,
            outcome: offerAccount.account.outcome['yes'] ? "Yes" : "No",
            status: offerAccount.account.status['open'] ? 'open' : (offerAccount.account.status['filled'] ? 'filled' : 'canceled'),
            creatorWithdrew: offerAccount.account.creatorWithdrew,
            takerWithdrew: offerAccount.account.takerWithdrew,
        };
        cachedProgramState.offers[offerAccount.publicKey.toString()] = offer;
        cachedProgramState.markets[offerAccount.account.market.toString()].offers[offerAccount.publicKey.toString()] = offer;

        if (offer.status === 'filled') {
            const offerKeyString = offer.key.toString();
            const marketKeyString = offer.market.toString();
            const market = cachedProgramState.markets[marketKeyString];
            const createKeyString = offer.creator.toString();
            if (!cachedProgramState.positions[createKeyString]) {
                cachedProgramState.positions[createKeyString] = {};
            }

            cachedProgramState.positions[createKeyString][offerKeyString] = {
                market: market,
                offer: offer,
                owner: offer.creator,
                betAccount: offer.creatorBetAccount,
                betAccountMint: offer.outcome === 'Yes' ? market.yesMint : market.noMint,
                outcome: offer.outcome,
                betAmount: offer.betAmount,
                canWithdraw: !offer.creatorWithdrew,
            }

            const takerKeyString = offer.taker?.toString();
            const takerBetAccount = offer.takerBetAccount;
            if (takerKeyString !== undefined && takerBetAccount !== undefined) {
                if (!cachedProgramState.positions[takerKeyString]) {
                    cachedProgramState.positions[takerKeyString] = {};
                }

                cachedProgramState.positions[takerKeyString][offerKeyString] = {
                    market: market,
                    offer: offer,
                    owner: new PublicKey(takerKeyString),
                    betAccount: offer.takerBetAccount,
                    betAccountMint: offer.outcome === 'Yes' ? market.noMint : market.yesMint,
                    outcome: offer.outcome === 'Yes' ? 'No' : 'Yes',
                    betAmount: offer.totalAmount.sub(offer.betAmount),
                    canWithdraw: !offer.takerWithdrew,
                }
            }
        }
    });

    // const connection = program.provider.connection;
    // await Promise.all(Object.entries(cachedProgramState.positions).reduce((promises, [owner, positions]) => {
    //     Object.values(positions).forEach(position => {
    //         const promise = async () => {
    //             const tokenAmount = await connection.getTokenAccountBalance(position.betAccount, 'max');
    //             if (tokenAmount.value.uiAmount !== null && tokenAmount.value.uiAmount > 0) {
    //                 position.canWithdraw = true;
    //             }
    //         }
    //         promises.push(promise());
    //     });
    //     return promises;
    // }, new Array<Promise<void>>()));
    return cachedProgramState;
}

export function getEmptyProgramState() : ProgramState {
    return {
        key: -1,
        markets: {},
        offers: {},
        positions: {}
    };
}

export {
    cachedProgramState
}