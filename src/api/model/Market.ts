import {Offer} from "./Offer";
import {PublicKey} from "@solana/web3.js";
import moment from "moment";
import BN from "bn.js";

export interface Market {
    key: PublicKey,
    creator: PublicKey,
    settler: PublicKey,
    symbol: string,
    date: moment.Moment,
    condition: string,
    outcome: string,
    value: BN,
    collateral: BN,
    yesTokens: BN,
    noTokens: BN,
    yesMint: PublicKey,
    yesMintAuthority: PublicKey,
    noMint: PublicKey,
    noMintAuthority: PublicKey,
    nonceAccount: PublicKey,
    nonceAccountAuthority: PublicKey,
    offers: {[key: string]: Offer},
    status: string,
    price: PublicKey,
    creatorWithdrew: boolean,
    settlerWithdrew: boolean,
}