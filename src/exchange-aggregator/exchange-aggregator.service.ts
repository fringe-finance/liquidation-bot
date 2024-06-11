import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { OpenOceanService } from './open-ocean/open-ocean.service';
import { ParaswapService } from './paraswap/paraswap.service';
import { ExchangeType as Dex } from 'src/helper/enums/dex';
import { BigNumberish } from 'ethers';
import { ERC20ContractService } from 'src/contract/erc20.service';
import { TokenInfo } from 'src/client/dto/liquidate-position.dto';
import { AssetType } from 'src/helper/enums/assetType';
import { getMaxDiscrepancyAmount } from 'utils/getMaxDiscrepancyAmount';
import { ERC4626ContractService } from 'src/contract/erc4626.service';
import { LPContractService } from 'src/contract/lp.service';

@Injectable()
export class ExchangeAggregatorService {
    constructor(
        private readonly paraswapService: ParaswapService,
        private readonly openOceanService: OpenOceanService,
        private readonly erc20Service: ERC20ContractService,
        private readonly erc4626Service: ERC4626ContractService,
        private readonly lpService: LPContractService,
    ) {}

    async buyOnDex(
        tokenSrc: string,
        tokenDest: string,
        tokenDestAmount: BigNumberish,
        swapOnDex: Dex,
        receiver: string,
        chainId: number,
        maxDiscrepancy: string = '0.005',
    ) {
        const tokenSrcInfo = await this.erc20Service.tokenInfo(
            chainId,
            tokenSrc,
        );
        const tokenDestInfo = await this.erc20Service.tokenInfo(
            chainId,
            tokenDest,
        );

        if (swapOnDex === Dex.Paraswap) {
            return await this.paraswapService.buyOnParaswap(
                tokenSrc,
                tokenSrcInfo.decimals,
                tokenDest,
                tokenDestInfo.decimals,
                tokenDestAmount,
                receiver,
                chainId.toString(),
                maxDiscrepancy,
            );
        } else if (swapOnDex === Dex.OpenOcean) {
            return await this.openOceanService.buyOnOpenOcean(
                tokenSrc,
                tokenSrcInfo.decimals,
                BigInt(1000000) * BigInt(10) ** BigInt(tokenSrcInfo.decimals),
                tokenDest,
                tokenDestAmount,
                receiver,
                chainId.toString(),
                maxDiscrepancy,
            );
        }
    }

    async estimateBuyOnDexLP(
        tokenIn: string,
        token0: string,
        amount0Desired: BigNumberish,
        token1: string,
        amount1Desired: BigNumberish,
        receiver: string,
        swapOnDex: Dex,
        chainId: number,
        maxDiscrepancy?: string,
    ) {
        let buyData0: { amountIn: BigNumberish; buyCallData: any } = {
            amountIn: BigInt(0),
            buyCallData: '',
        };
        let buyData1: { amountIn: BigNumberish; buyCallData: any } = {
            amountIn: BigInt(0),
            buyCallData: '',
        };
        if (tokenIn.toLowerCase() !== token0.toLowerCase()) {
            buyData0 = await this.buyOnDex(
                tokenIn,
                token0,
                amount0Desired,
                swapOnDex,
                receiver,
                chainId,
                maxDiscrepancy,
            );
        } else {
            buyData0 = {
                amountIn: BigInt(amount0Desired),
                buyCallData: null,
            };
        }
        if (tokenIn.toLowerCase() !== token1.toLowerCase()) {
            buyData1 = await this.buyOnDex(
                tokenIn,
                token1,
                amount1Desired,
                swapOnDex,
                receiver,
                chainId,
                maxDiscrepancy,
            );
        } else {
            buyData1 = {
                amountIn: BigInt(amount1Desired),
                buyCallData: null,
            };
        }

        return {
            buyData0,
            buyData1,
        };
    }

    async estimateSellOnDexLP(
        tokenOut: string,
        token0: string,
        erc20EstimatedAmountForToken0: BigNumberish,
        token1: string,
        erc20EstimatedAmountForToken1: BigNumberish,
        receiver: string,
        swapOnDex: Dex,
        chainId: number,
        maxDiscrepancy?: string,
    ) {
        let sellData0: { amountIn: BigNumberish; buyCallData: any } = {
            amountIn: BigInt(0),
            buyCallData: '',
        };
        let sellData1: { amountIn: BigNumberish; buyCallData: any } = {
            amountIn: BigInt(0),
            buyCallData: '',
        };
        if (tokenOut.toLowerCase() !== token0.toLowerCase()) {
            sellData0 = await this.buyOnDex(
                token0,
                tokenOut,
                erc20EstimatedAmountForToken0,
                swapOnDex,
                receiver,
                chainId,
                maxDiscrepancy,
            );
        } else {
            sellData0 = {
                amountIn: BigInt(erc20EstimatedAmountForToken0),
                buyCallData: null,
            };
        }
        if (tokenOut.toLowerCase() !== token1.toLowerCase()) {
            sellData1 = await this.buyOnDex(
                token1,
                tokenOut,
                erc20EstimatedAmountForToken1,
                swapOnDex,
                receiver,
                chainId,
                maxDiscrepancy,
            );
        } else {
            sellData1 = {
                amountIn: BigInt(erc20EstimatedAmountForToken1),
                buyCallData: null,
            };
        }

        return {
            sellData0,
            sellData1,
        };
    }

    async estimate(
        tokenIn: TokenInfo,
        tokenOut: TokenInfo,
        expectedAmountOut: BigNumberish,
        receiver: string,
        maxDiscrepancy: string,
        chainId: number,
        dexType: Dex,
    ) {
        const tokenTypeIn =
            AssetType[tokenIn.tokenType as keyof typeof AssetType];
        const tokenTypeOut =
            AssetType[tokenOut.tokenType as keyof typeof AssetType];
        if (
            tokenTypeIn === AssetType.ERC20 &&
            tokenTypeOut === AssetType.ERC20
        ) {
            return await this.estimateBuyERC20FromERC20(
                tokenIn,
                tokenOut,
                expectedAmountOut,
                receiver,
                maxDiscrepancy,
                chainId,
                dexType,
            );
        } else if (
            tokenTypeIn === AssetType.ERC20 &&
            tokenTypeOut === AssetType.ERC4626
        ) {
            return this.estimateBuyERC4626FromERC20(
                tokenIn,
                tokenOut,
                expectedAmountOut,
                receiver,
                maxDiscrepancy,
                chainId,
                dexType,
            );
        } else if (
            tokenTypeIn === AssetType.ERC4626 &&
            tokenTypeOut === AssetType.ERC20
        ) {
            return this.estimateBuyERC20FromERC4626(
                tokenOut,
                tokenIn,
                expectedAmountOut,
                receiver,
                maxDiscrepancy,
                chainId,
                dexType,
            );
        } else if (
            tokenTypeIn === AssetType.ERC20 &&
            tokenTypeOut === AssetType.LP
        ) {
            return this.estimateBuyLPFromERC20(
                tokenOut,
                tokenIn,
                expectedAmountOut,
                receiver,
                maxDiscrepancy,
                chainId,
                dexType,
            );
        } else if (
            tokenTypeIn === AssetType.LP &&
            tokenTypeOut === AssetType.ERC20
        ) {
            return this.estimateBuyERC20FromLP(
                tokenOut,
                tokenIn,
                expectedAmountOut,
                receiver,
                maxDiscrepancy,
                chainId,
                dexType,
            );
        } else if (
            tokenTypeIn === AssetType.ERC4626 &&
            tokenTypeOut === AssetType.ERC4626
        ) {
            return this.estimateBuyERC4626FromERC4626(
                tokenOut,
                tokenIn,
                expectedAmountOut,
                receiver,
                maxDiscrepancy,
                chainId,
                dexType,
            );
        } else if (
            tokenTypeIn === AssetType.LP &&
            tokenTypeOut === AssetType.ERC4626
        ) {
            return this.estimateBuyERC4626FromLP(
                tokenOut,
                tokenIn,
                expectedAmountOut,
                receiver,
                maxDiscrepancy,
                chainId,
                dexType,
            );
        } else if (
            tokenTypeIn === AssetType.ERC4626 &&
            tokenTypeOut === AssetType.LP
        ) {
            return this.estimateBuyLPFromERC4626(
                tokenOut,
                tokenIn,
                expectedAmountOut,
                receiver,
                maxDiscrepancy,
                chainId,
                dexType,
            );
        }
        throw new Error("Haven't implemented yet");
    }

    async estimateBuyERC20FromERC20(
        tokenIn: TokenInfo,
        tokenOut: TokenInfo,
        expectedAmountOut: BigNumberish,
        receiver: string,
        maxDiscrepancy: string,
        chainId: number,
        dexType: Dex,
    ) {
        const buyOrSellData =
            tokenIn.address.toLowerCase() === tokenOut.address.toLowerCase()
                ? { amountIn: expectedAmountOut, buyCallData: null }
                : await this.buyOnDex(
                      tokenIn.address,
                      tokenOut.address,
                      expectedAmountOut,
                      dexType,
                      receiver,
                      chainId,
                      maxDiscrepancy,
                  );

        return {
            tokenIn: tokenIn,
            estimateAmountIn: buyOrSellData.amountIn,
            tokenOut: tokenOut,
            expectedAmountOut,
            buyCallData: [buyOrSellData.buyCallData].filter((data) => !!data),
        };
    }

    async estimateBuyERC4626FromERC20(
        tokenIn: TokenInfo,
        tokenOut: TokenInfo,
        expectedAmountOut: BigNumberish,
        receiver: string,
        maxDiscrepancy: string,
        chainId: number,
        dexType: Dex,
    ) {
        const erc4626Underlying = tokenOut.underlyingTokens[0];
        const estimateAmountIn = await this.erc4626Service.convertToAssets(
            chainId,
            tokenOut.address,
            expectedAmountOut,
        );
        if (tokenIn.address.toLowerCase() === erc4626Underlying.toLowerCase()) {
            return {
                tokenIn: tokenIn.address,
                tokenOut: tokenOut.address,
                estimateAmountIn: BigInt(estimateAmountIn),
                expectedAmountOut: expectedAmountOut,
                buyCallData: [],
            };
        } else {
            const buyOrSellData = await this.buyOnDex(
                tokenIn.address,
                erc4626Underlying,
                estimateAmountIn,
                dexType,
                receiver,
                chainId,
                maxDiscrepancy,
            );

            return {
                tokenIn: tokenIn.address,
                tokenOut: tokenOut.address,
                estimateAmountIn: BigInt(buyOrSellData.amountIn),
                expectedAmountOut: expectedAmountOut,
                buyCallData: [buyOrSellData.buyCallData],
            };
        }
    }

    async estimateBuyERC20FromERC4626(
        tokenIn: TokenInfo,
        tokenOut: TokenInfo,
        expectedAmountOut: BigNumberish,
        receiver: string,
        maxDiscrepancy: string,
        chainId: number,
        dexType: Dex,
    ) {
        const erc4626Underlying = tokenIn.underlyingTokens[0];
        const estimation = await this.estimateBuyERC20FromERC20(
            { ...tokenIn, address: erc4626Underlying },
            tokenOut,
            expectedAmountOut,
            receiver,
            maxDiscrepancy,
            chainId,
            dexType,
        );
        const estimateAmountIn = await this.erc4626Service.convertToShares(
            chainId,
            tokenIn.address,
            estimation.estimateAmountIn,
        );

        return {
            tokenIn: tokenIn.address,
            tokenOut: tokenOut.address,
            estimateAmountIn: BigInt(estimateAmountIn),
            expectedAmountOut: expectedAmountOut,
            buyCallData: estimation.buyCallData,
        };
    }

    async estimateBuyLPFromERC20(
        tokenIn: TokenInfo,
        tokenOut: TokenInfo,
        expectedAmountOut: BigNumberish,
        receiver: string,
        maxDiscrepancy: string,
        chainId: number,
        dexType: Dex,
    ) {
        const {
            lpTotalSupply,
            // token 0
            lpToken0Address,
            lpToken0Reserve,
            // token 1
            lpToken1Address,
            lpToken1Reserve,
        } = await this.lpService.unwrapLP(chainId, tokenOut.address);
        const lpAcceptableAmount = getMaxDiscrepancyAmount(
            BigInt(expectedAmountOut),
            maxDiscrepancy,
        );
        const lpToken0DesiredAmount =
            (BigInt(lpAcceptableAmount) * BigInt(lpToken0Reserve)) /
            BigInt(lpTotalSupply);
        const lpToken1DesiredAmount =
            (BigInt(lpAcceptableAmount) * BigInt(lpToken1Reserve)) /
            BigInt(lpTotalSupply);

        const { buyData0: lpToken0BuyData, buyData1: lpToken1BuyData } =
            await this.estimateBuyOnDexLP(
                tokenIn.address,
                lpToken0Address,
                lpToken0DesiredAmount,
                lpToken1Address,
                lpToken1DesiredAmount,
                receiver,
                dexType,
                chainId,
                maxDiscrepancy,
            );
        const erc20AmountEstimated =
            BigInt(lpToken0BuyData.amountIn) + BigInt(lpToken1BuyData.amountIn);

        return {
            tokenIn: tokenIn.address,
            tokenOut: tokenOut.address,
            estimateAmountIn: erc20AmountEstimated,
            expectedAmountOut: expectedAmountOut,
            buyCallData: [
                lpToken0BuyData.buyCallData,
                lpToken1BuyData.buyCallData,
            ].filter((data) => !!data),
        };
    }

    async estimateBuyERC20FromLP(
        tokenIn: TokenInfo,
        tokenOut: TokenInfo,
        expectedAmountOut: BigNumberish,
        receiver: string,
        maxDiscrepancy: string,
        chainId: number,
        dexType: Dex,
    ) {
        const {
            lpTotalSupply,
            // token 0
            lpToken0Address,
            lpToken0Reserve,
            // token 1
            lpToken1Address,
            lpToken1Reserve,
        } = await this.lpService.unwrapLP(chainId, tokenIn.address);
        const erc20EstimatedAmountForToken0 = getMaxDiscrepancyAmount(
            BigInt(expectedAmountOut) / BigInt(2),
            (Number(maxDiscrepancy) / 2).toString()
        );
        const erc20EstimatedAmountForToken1 = erc20EstimatedAmountForToken0;

        const { sellData0: lpToken0SellData, sellData1: lpToken1SellData } =
            await this.estimateSellOnDexLP(
                tokenOut.address,
                lpToken0Address,
                erc20EstimatedAmountForToken0,
                lpToken1Address,
                erc20EstimatedAmountForToken1,
                receiver,
                dexType,
                chainId,
                maxDiscrepancy,
            );

        const lpToken0EstimatedAmount = lpToken0SellData.amountIn;
        const lpToken1EstimatedAmount = lpToken1SellData.amountIn;
        const lpEstimatedAmountWithToken0 =
            (BigInt(lpToken0EstimatedAmount) * BigInt(lpTotalSupply)) /
            BigInt(lpToken0Reserve);
        const lpEstimatedAmountWithToken1 =
            (BigInt(lpToken1EstimatedAmount) * BigInt(lpTotalSupply)) /
            BigInt(lpToken1Reserve);
        const lpEstimatedAmount =
            BigInt(lpEstimatedAmountWithToken0) >
            BigInt(lpEstimatedAmountWithToken1)
                ? BigInt(lpEstimatedAmountWithToken0)
                : BigInt(lpEstimatedAmountWithToken1);
        return {
            tokenIn: tokenIn.address,
            tokenOut: tokenOut.address,
            estimateAmountIn: lpEstimatedAmount,
            expectedAmountOut: expectedAmountOut,
            buyCallData: [
                lpToken0SellData?.buyCallData,
                lpToken1SellData?.buyCallData,
            ].filter((data) => !!data),
        };
    }

    async estimateBuyERC4626FromERC4626(
        tokenIn: TokenInfo,
        tokenOut: TokenInfo,
        expectedAmountOut: BigNumberish,
        receiver: string,
        maxDiscrepancy: string,
        chainId: number,
        dexType: Dex,
    ) {
        const tokenInUnderlying = tokenIn.underlyingTokens[0];
        let estimation = await this.estimateBuyERC4626FromERC20(
            { ...tokenIn, address: tokenInUnderlying },
            tokenOut,
            expectedAmountOut,
            receiver,
            maxDiscrepancy,
            chainId,
            dexType,
        );
        const estimateAmountIn = await this.erc4626Service.convertToShares(
            chainId,
            tokenIn.address,
            estimation.estimateAmountIn,
        );
        estimation.estimateAmountIn = estimateAmountIn;
        return estimation;
    }

    async estimateBuyERC4626FromLP(
        tokenIn: TokenInfo,
        tokenOut: TokenInfo,
        expectedAmountOut: BigNumberish,
        receiver: string,
        maxDiscrepancy: string,
        chainId: number,
        dexType: Dex,
    ) {
        const tokenOutUnderlying = tokenOut.underlyingTokens[0];
        const erc20ExpectedAmount = await this.erc4626Service.convertToAssets(
            chainId,
            tokenOut.address,
            expectedAmountOut,
        );

        return this.estimateBuyERC20FromLP(
            tokenIn,
            { ...tokenOut, address: tokenOutUnderlying },
            erc20ExpectedAmount,
            receiver,
            maxDiscrepancy,
            chainId,
            dexType,
        );
    }

    async estimateBuyLPFromERC4626(
        tokenIn: TokenInfo,
        tokenOut: TokenInfo,
        expectedAmountOut: BigNumberish,
        receiver: string,
        maxDiscrepancy: string,
        chainId: number,
        dexType: Dex,
    ) {
        const tokenInUnderlying = tokenIn.underlyingTokens[0];
        const estimation = await this.estimateBuyLPFromERC20(
            { ...tokenIn, address: tokenInUnderlying },
            tokenOut,
            expectedAmountOut,
            receiver,
            maxDiscrepancy,
            chainId,
            dexType,
        );

        const estimateAmountIn = await this.erc4626Service.convertToShares(
            chainId,
            tokenIn.address,
            BigInt(estimation.estimateAmountIn),
        );

        return {
            tokenIn: tokenIn.address,
            tokenOut: tokenOut.address,
            estimateAmountIn: BigInt(estimateAmountIn),
            expectedAmountOut: expectedAmountOut,
            buyCallData: estimation.buyCallData,
        };
    }
}
