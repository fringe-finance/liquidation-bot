import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { LiquidatablePosition } from 'src/client/dto/liquidate-position.dto';
import { FringeService } from 'src/client/fringe.service';
import { GasPriceService } from 'src/gas-price/gas-price.service';
import { uint256ToNumber } from 'src/helper/common';
import { LiquidationContractService } from 'src/contract/liquidation.service';
import { LogService } from 'src/log/log.service';
import { PriceTokenService } from 'src/price-token/price-token.service';
import { PriceAggregatorService } from 'src/contract/price-aggregator.service';
import {
    LiquidateParams,
    TokenType,
} from 'src/contract/dto/liquidate-params.dto';
import { ExchangeAggregatorService } from 'src/exchange-aggregator/exchange-aggregator.service';
import { BigNumberish } from 'ethers';
import { ExchangeType } from 'src/helper/enums/dex';
import { UpdatePriceData } from 'src/contract/dto/update-price-data.dto';

@Injectable()
export class LiquidateService {
    private readonly chainNetworkId;
    private readonly enableCheckProfit;
    private readonly usdDecimals = 10;

    constructor(
        private readonly configService: ConfigService,
        private readonly logService: LogService,
        private readonly fringeService: FringeService,
        private readonly liquidationContractService: LiquidationContractService,
        private readonly gasPriceService: GasPriceService,
        private readonly tokenPriceService: PriceTokenService,
        private readonly priceAggregatorService: PriceAggregatorService,
        private readonly exchangeAggregatorService: ExchangeAggregatorService,
    ) {
        const networkId = this.configService.get('NETWORK_ID');
        this.chainNetworkId = Number(networkId);
        const enableCheckProfit = this.configService.get('ENABLE_CHECK_PROFIT');
        if (enableCheckProfit) {
            this.enableCheckProfit =
                enableCheckProfit.trim() === 'true' ? true : false;
        } else {
            this.enableCheckProfit = true;
        }
    }

    @Cron(process.env.CRON_EXPRESSION)
    async handleCron() {
        const chainNetworkId = this.chainNetworkId;
        this.logService.log(`Start liquidate on network ${chainNetworkId}`);

        const fringe = await this.fringeService.getLiquidatePositions();
        if (
            !fringe ||
            fringe.borrowers.length == 0 ||
            fringe.liquidatablePositions.length == 0
        ) {
            this.logService.log('There is no liquidatable position!');
        } else {
            const { liquidatablePositions } = fringe;
            for (let j = 0; j < liquidatablePositions.length; j++) {
                const liquidatablePosition = liquidatablePositions[j];
                await this.liquidate(chainNetworkId, liquidatablePosition);
            }
        }
        this.logService.log(`End liquidate on network ${chainNetworkId}`);
        this.logService.log(
            '--------------------------------------------------------------------------------------------------',
        );
    }

    private async liquidate(
        chainNetworkId: number,
        liquidatablePosition: LiquidatablePosition,
    ) {
        try {
            const liquidationContractAddress =
                this.configService.get(`LIQUIDATION_ADDRESS`);
            this.logService.log(
                '----------------------------------------------',
            );
            this.logService.log(
                'Liquidate for position: ',
                liquidatablePosition,
            );
            let totalDebt = BigInt(
                liquidatablePosition.lendingTokenOutstandingCount,
            );
            const maxLA = BigInt(liquidatablePosition.maxRepaymentTokenCount);
            const minLA = BigInt(liquidatablePosition.minRepaymentTokenCount);
            let lendingAmount = totalDebt < minLA ? minLA : totalDebt;
            lendingAmount = lendingAmount > maxLA ? maxLA : lendingAmount;

            const updatePriceData =
                await this.priceAggregatorService.getUpdatePriceData(
                    chainNetworkId,
                    this.configService.get(`PRICE_AGGREGATOR_CONTRACT_ADDRESS`),
                    [
                        ...liquidatablePosition.collateralToken
                            .underlyingTokens,
                        ...liquidatablePosition.lendingToken.underlyingTokens,
                    ],
                );

            const exchangeType =
                await this.liquidationContractService.getExchangeAggregatorType(
                    chainNetworkId,
                    liquidationContractAddress,
                );

            const liquidateParam = await this.getLiquidateParams(
                liquidatablePosition,
                lendingAmount,
                updatePriceData,
                exchangeType,
                chainNetworkId,
            )

            const { gasPrice, gasLimit } = await this.estimateTransactionFee(
                chainNetworkId,
                liquidationContractAddress,
                liquidateParam,
            );

            const isHaveProfit =
                gasPrice &&
                gasLimit &&
                (await this.isHaveProfit(
                    chainNetworkId,
                    liquidationContractAddress,
                    liquidateParam,
                    gasPrice * gasLimit,
                ));

            if (
                ((this.enableCheckProfit && isHaveProfit) ||
                    !this.enableCheckProfit) &&
                liquidateParam.buyCalldata !== undefined
            ) {
                this.logService.log('Liquidate flashParam: ');
                this.logService.log(liquidateParam);
                await this.liquidationContractService.liquidate(
                    chainNetworkId,
                    liquidationContractAddress,
                    liquidateParam,
                    gasLimit,
                    gasPrice,
                );
            }
        } catch (error) {
            this.logService.error('Error when liquidate: ', error);
        }
    }

    private async estimateTransactionFee(
        chainId: number,
        contractAddress: string,
        params: LiquidateParams,
    ) {
        const gasPrice = await this.gasPriceService.getGasPrice();
        const gasLimit = await this.liquidationContractService.estimateGas(
            chainId,
            contractAddress,
            params,
        );
        this.logService.log('gasPrice', gasPrice.toString());
        this.logService.log('gasLimit', gasLimit.toString());
        return {
            gasPrice,
            gasLimit,
        };
    }

    private async getLiquidateParams(
        liquidatablePosition: LiquidatablePosition, 
        lendingAmount: BigNumberish, 
        updatePriceData: UpdatePriceData, 
        exchangeType: ExchangeType, 
        chainNetworkId: number
    ): Promise<LiquidateParams> {
        const callData = await this.exchangeAggregatorService.estimate(
            liquidatablePosition.collateralToken,
            liquidatablePosition.lendingToken,
            lendingAmount,
            this.configService.get('PLP_LIQUIDATION_CONTRACT_ADDRESS'),
            this.configService.get('MAX_DISCREPANCY'),
            chainNetworkId,
            exchangeType
        );
    
        const liquidateParam: LiquidateParams = {
            borrower: liquidatablePosition.borrowerAddress,
            collateralInfo: {
                addr: liquidatablePosition.collateralToken.address,
                tokenType: TokenType[liquidatablePosition.collateralToken.tokenType as keyof typeof TokenType],
            },
            lendingInfo: {
                addr: liquidatablePosition.lendingToken.address,
                tokenType: TokenType[liquidatablePosition.lendingToken.tokenType as keyof typeof TokenType],
            },
            liquidationAmount: lendingAmount,
            priceIds: updatePriceData.priceIds,
            updateData: updatePriceData.updateData,
            buyCalldata: callData?.buyCallData,
            updateFee: BigInt(updatePriceData.updateFee),
        };
    
        return liquidateParam;
    }

    private async isHaveProfit(
        chainNetworkId: number,
        liquidationContractAddress: string,
        liquidateParam: LiquidateParams,
        transactionFee: bigint,
    ) {
        const estimatedCollateralReward =
            await this.liquidationContractService.getEstimatedCollateralReward(
                chainNetworkId,
                liquidationContractAddress,
                this.configService.get(`PLP_CONTRACT_ADDRESS`),
                liquidateParam,
            );

        const profitInUSD = uint256ToNumber(
            BigInt(estimatedCollateralReward),
            this.usdDecimals,
        );

        const nativePrice = await this.tokenPriceService.getNativeCoinPrice(
            chainNetworkId,
        );
        const transactionFeeInNumber = uint256ToNumber(transactionFee, 18);
        const transactionFeeInUSD = transactionFeeInNumber * nativePrice;
        this.logService.log('profitAmountInUSD', profitInUSD.toString());
        this.logService.log(
            'transactionFeeInUSD',
            transactionFeeInUSD.toString(),
        );

        if (profitInUSD > transactionFeeInUSD) return true;
        return false;
    }
}
