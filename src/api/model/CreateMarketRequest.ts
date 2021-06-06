import BN from "bn.js";
import moment from "moment";

export interface CreateMarketRequest {
    symbol: string,
    date: moment.Moment,
    condition: string,
    value: BN,
}