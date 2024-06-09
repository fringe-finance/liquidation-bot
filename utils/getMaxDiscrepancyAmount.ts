import { BigNumberish } from "ethers";

export const getMaxDiscrepancyAmount = (actualAmountOut: BigNumberish, maxDiscrepancy: string): BigNumberish => {
    let maxDiscrepancyLen = maxDiscrepancy.length;
    let numerator = (
        Number(maxDiscrepancy) * 10 ** (maxDiscrepancyLen - 2) +
        10 ** (maxDiscrepancyLen - 2)
    ).toString();
    let denominator = (10 ** (maxDiscrepancyLen - 2)).toString();
    return BigInt(actualAmountOut) +
    BigInt(actualAmountOut) * BigInt(numerator) / (BigInt(denominator) - BigInt(actualAmountOut))
};
