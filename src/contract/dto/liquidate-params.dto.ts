export interface LiquidateParams {
    borrower: string;
    collateralToken: string;
    lendingToken: string;
    priceIds: string[];
    updateData: string[]
    updateFee: BigInt;
}
