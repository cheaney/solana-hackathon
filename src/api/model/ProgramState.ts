import {Market} from "./Market";
import {Offer} from "./Offer";
import {Position} from "./Position";


export interface ProgramState {
    key: number,
    markets: {[key: string]: Market},
    offers: {[key: string]: Offer},
    positions: {[key: string]: {[key: string]: Position}},
}