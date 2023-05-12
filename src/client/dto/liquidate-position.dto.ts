export interface LiquidationPosition {
    timestamp: string;
    borrowers: Borrower[];
    liquidatablePositions: LiquidatablePosition[];
}

export interface Borrower {
    address: string;
    prjTokenAddress: string;
    lendingTokenAddress: string;
    depositedAmount: string;
}

export interface LiquidatablePosition {
    borrowerAddress: string;
    collateralTokenAddress: string;
    collateralTokenValue: string;
    collateralTokenCount: string;
    lendingTokenAddress: string;
    lendingTokenOutstandingCount: string;
    lendingTokenOutstandingValue: string;
    healthFactor: number;
    minRepaymentTokenCount: string;
    maxRepaymentTokenCount: string;
    liquidatorRewardFactor: number;
    chainId: number;
}
