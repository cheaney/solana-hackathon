import BN from "bn.js";
import {PublicKey} from "@solana/web3.js";
import {Market} from "./Market";

export interface MakeOfferRequest {
    market: Market,
    outcome: string,
    amount: BN,
}