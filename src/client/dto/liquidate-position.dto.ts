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
    collateralTokenValue: string;
    collateralTokenCount: string;
    lendingToken: TokenInfo;
    lendingTokenOutstandingCount: string;
    lendingTokenOutstandingValue: string;
    healthFactor: number;
    minRepaymentTokenCount: string;
    maxRepaymentTokenCount: string;
    liquidatorRewardFactor: number;
    chainId: number;
}

export interface TokenInfo {
    address: string;
    tokenType: string;
    underlyingTokens: string[];
}
