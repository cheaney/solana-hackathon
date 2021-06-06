import {Offer} from "./model/Offer";
import {Market} from "./model/Market";
import {calculateToWinAmount} from "./offersMath";
import {formatSOL, formatUSD} from "./numberFormatter";

const formatConfirmationMessage = (offer: Offer, market: Market) => {
    return `
        Bet ${formatSOL(calculateToWinAmount(offer.betAmount))} to win ${formatSOL(offer.betAmount)}
        that ${market.symbol} will be ${offer.outcome === 'Yes' ? "below" : "above"} ${formatUSD(market.value)}
        on ${market.date.format("MM/DD/YYYY")}
    `
};

const formatTakeOfferSuccessMessage = (offer: Offer, market: Market) => {
    return `
        Successfully bet ${formatSOL(calculateToWinAmount(offer.betAmount))} to win ${formatSOL(offer.betAmount)}
        that ${market.symbol} will be ${offer.outcome === 'Yes' ? "below" : "above"} ${formatUSD(market.value)}
        on ${market.date.format("MM/DD/YYYY")}
    `
}

const formatMakeOfferSuccessMessage = (offer: Offer, market: Market) => {
    return `
        Successfully made offer to bet ${formatSOL(offer.betAmount)} to win ${formatSOL(calculateToWinAmount(offer.betAmount))}
        that ${market.symbol} will be ${offer.outcome === 'Yes' ? "above" : "below"} ${formatUSD(market.value)}
        on ${market.date.format("MM/DD/YYYY")}
    `
}

export {
    formatConfirmationMessage,
    formatTakeOfferSuccessMessage,
    formatMakeOfferSuccessMessage
}