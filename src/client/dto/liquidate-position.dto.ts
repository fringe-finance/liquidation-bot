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
    collateralToken: TokenInfo;
    lendingToken: TokenInfo;
    totalOutstandingAmount: string;
    healthFactor: number;
    liquidatorRewardFactor: number;
    chainId: number;
}

export interface TokenInfo {
    address: string;
    tokenType: string;
    underlyingAssets: string[];
}
