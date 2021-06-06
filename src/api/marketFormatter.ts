import {Market} from "./model/Market";
import {formatUSD} from "./numberFormatter";

const formatMarketTitle = (market: Market) => {
    return `${market.date.format("MM/DD/YYYY")} — ${market.symbol} ${market.condition} ${formatUSD(market.value)}`
}

export {
    formatMarketTitle
}