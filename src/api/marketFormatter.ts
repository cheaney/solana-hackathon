import {Market} from "./model/Market";
import {formatUSD} from "./numberFormatter";
import {pythMap} from "./storage/pyth";
import BN from "bn.js";

const formatMarketTitle = (market: Market) => {
    return `${market.date.format("MM/DD/YYYY")} — ${market.symbol} ${market.condition} ${formatUSD(market.value, new BN(10**pythMap[market.symbol].exponent))}`
}

export {
    formatMarketTitle
}