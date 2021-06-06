import {PublicKey} from "@solana/web3.js";
import BN from "bn.js";

export interface Offer {
    key: PublicKey,
    creator: PublicKey,
    taker?: PublicKey,
    market: PublicKey,
    creatorBetAccount: PublicKey,
    takerBetAccount: PublicKey,
    betAmount: BN,
    totalAmount: BN,
    outcome: string,
    status: string
    creatorWithdrew: boolean,
    takerWithdrew: boolean,
}