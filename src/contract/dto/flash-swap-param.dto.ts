import { LiquidateParams } from './liquidate-params.dto';

export interface FlashSwapParams {
    token0: string;
    token1: string;
    amount0: bigint;
    amount1: bigint;
    liquidateParam: LiquidateParams;
}
