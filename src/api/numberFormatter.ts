import BN from "bn.js";

const usdFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});
const solFormatter = new Intl.NumberFormat('en-US');
const SOL_EXP = new BN(10**9);

const formatUSDNum = (num: number) => usdFormatter.format(num);
const formatUSD = (bn: BN, exp: BN = SOL_EXP) => usdFormatter.format(bn.div(exp).toNumber());
const formatSOL = (bn: BN) => solFormatter.format(bn.div(SOL_EXP).toNumber()) + " SOL";
const formatBN = (bn: BN) => solFormatter.format(bn.div(SOL_EXP).toNumber());

export {
    formatUSDNum,
    formatUSD,
    formatSOL,
    formatBN,
    SOL_EXP
}