import { BigNumberish } from "ethers";

export interface LiquidateParams {
    borrower: string;
    collateralInfo: Info;
    lendingInfo: Info;
    liquidationAmount: BigNumberish;
    priceIds: string[];
    updateData: string[];
    buyCalldata: string[];
    updateFee: BigNumberish;
}

export enum TokenType {
    ERC20,
    ERC4626,
    LP
}

export interface Info {
    addr: string;
    tokenType: TokenType;
}