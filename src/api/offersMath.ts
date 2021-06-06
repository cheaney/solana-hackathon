import BN from "bn.js";

const calculateTotalAmount = (betAmount: BN) => {
    return new BN(Math.pow(10, Math.floor(Math.log10(betAmount.toNumber())) + 1));
}

const calculateToWinAmount = (amount: BN) => {
    return calculateTotalAmount(amount).sub(amount);
}

export {
    calculateTotalAmount,
    calculateToWinAmount
}