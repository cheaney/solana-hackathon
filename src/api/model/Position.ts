import {PublicKey} from "@solana/web3.js";
import BN from "bn.js";
import {Market} from "./Market";
import {Offer} from "./Offer";

export interface Position {
    market: Market,
    offer: Offer,
    owner: PublicKey,
    betAccount: PublicKey,
    betAccountMint: PublicKey,
    outcome: string,
    betAmount: BN,
    canWithdraw: boolean,
}