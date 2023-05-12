import { LiquidateParams } from '../contract/dto/liquidate-params.dto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LiquidatablePosition } from 'src/client/dto/liquidate-position.dto';
import { FringeModule } from 'src/client/fringe.module';
import { FringeService } from 'src/client/fringe.service';
import { GasPriceService } from 'src/gas-price/gas-price.service';
import { stringToArray, uint256ToNumber } from 'src/helper/common';
import { FlashSwapParams } from 'src/contract/dto/flash-swap-param.dto';
import { LiquidationBotContractService } from 'src/contract/liquidation-bot-contract.service';
import { LogService } from 'src/log/log.service';
import { PriceTokenService } from 'src/price-token/price-token.service';
import { ERC20ContractService } from 'src/contract/erc20.service';

@Injectable()
export class LiquidateService {
    private readonly chainNetworkId;
    private readonly enableCheckProfit;
    constructor(
        private readonly configService: ConfigService,
        private readonly logService: LogService,
        private readonly fringeService: FringeService,
        private readonly liquidationBotContractService: LiquidationBotContractService,
        private readonly gasPriceService: GasPriceService,
        private readonly tokenPriceService: PriceTokenService,
        private readonly erc20Service: ERC20ContractService,
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
        if (!fringe || fringe.liquidatablePositions.length == 0)
            this.logService.log('There is no liquidatable position!', fringe);

        const { liquidatablePositions } = fringe;
        for (let j = 0; j < liquidatablePositions.length; j++) {
            const liquidatablePosition = liquidatablePositions[j];
            await this.liquidate(chainNetworkId, liquidatablePosition);
        }
        this.logService.log(`End liquidate on network ${chainNetworkId}`);
    }

    private async liquidate(
        chainNetworkId: number,
        liquidatablePosition: LiquidatablePosition,
    ) {
        const liquidationBotContractAddress = this.configService.get(
            `LIQUIDATION_BOT_ADDRESS`,
        );
        this.logService.log('Liquidate for position: ', liquidatablePosition);
        const lendingAmount = BigInt(
            liquidatablePosition.lendingTokenOutstandingCount,
        );
        const maxLA = BigInt(liquidatablePosition.maxRepaymentTokenCount);
        const minLA = BigInt(liquidatablePosition.minRepaymentTokenCount);
        let amount1 = lendingAmount < minLA ? minLA : lendingAmount;
        amount1 = amount1 > maxLA ? maxLA : amount1;

        const flashParam: FlashSwapParams = {
            token0: liquidatablePosition.collateralTokenAddress,
            token1: liquidatablePosition.lendingTokenAddress,
            amount0: BigInt(0),
            amount1,
            liquidateParam: {
                borrower: liquidatablePosition.borrowerAddress,
                collateralToken: liquidatablePosition.collateralTokenAddress,
                lendingToken: liquidatablePosition.lendingTokenAddress,
            },
        };
        const { gasPrice, gasLimit } = await this.estimateTransactionFee(
            chainNetworkId,
            liquidationBotContractAddress,
            flashParam,
        );

        const isHaveProfit =
            gasPrice &&
            gasLimit &&
            (await this.isHaveProfit(
                chainNetworkId,
                liquidationBotContractAddress,
                liquidatablePosition,
                gasPrice * gasLimit,
            ));

        if (
            (this.enableCheckProfit && isHaveProfit) ||
            !this.enableCheckProfit
        ) {
            await this.liquidationBotContractService.initFlash(
                chainNetworkId,
                liquidationBotContractAddress,
                flashParam,
                gasLimit,
                gasPrice,
            );
        }
        this.logService.log(
            '-----------------------------------------------------------------------------------',
        );
    }

    private async estimateTransactionFee(
        chainId: number,
        contractAddress: string,
        params: FlashSwapParams,
    ) {
        const gasPrice = await this.gasPriceService.getGasPrice();
        const gasLimit = await this.liquidationBotContractService.estimateGas(
            chainId,
            contractAddress,
            params,
        );
        this.logService.log('gasPrice', gasPrice);
        this.logService.log('gasLimit', gasLimit);
        return {
            gasPrice,
            gasLimit,
        };
    }

    private async isHaveProfit(
        chainNetworkId: number,
        liquidationBotContractAddress: string,
        liquidatablePosition: LiquidatablePosition,
        transactionFee: bigint,
    ) {
        const {
            collateralTokenAddress,
            collateralTokenCount,
            collateralTokenValue,
            lendingTokenAddress,
            maxRepaymentTokenCount,
        } = liquidatablePosition;
        const rewardAmount =
            await this.liquidationBotContractService.getAmountCollateralRequired(
                chainNetworkId,
                liquidationBotContractAddress,
                collateralTokenAddress,
                lendingTokenAddress,
                maxRepaymentTokenCount,
            );
        const { decimals, symbol } = await this.erc20Service.tokenInfo(
            chainNetworkId,
            collateralTokenAddress,
        );
        const profitAmountInNumber = uint256ToNumber(
            BigInt(collateralTokenCount) - rewardAmount,
            decimals,
        );
        const collateralPrice = await this.tokenPriceService.getTokenPrice(
            chainNetworkId,
            collateralTokenAddress,
            decimals,
            symbol,
            collateralTokenValue,
            collateralTokenCount,
        );
        const profitInUSD = collateralPrice * profitAmountInNumber;

        const nativePrice = await this.tokenPriceService.getNativeCoinPrice(
            chainNetworkId,
        );
        const transactionFeeInNumber = uint256ToNumber(transactionFee, 18);
        const transactionFeeInUSD = transactionFeeInNumber * nativePrice;
        this.logService.log('profitAmountInNumber', profitAmountInNumber);
        this.logService.log('collateralPrice', collateralPrice);
        this.logService.log('profitInUSD', profitInUSD);
        this.logService.log('transactionFee', transactionFee);
        this.logService.log('nativePrice', nativePrice);
        this.logService.log('transactionFeeInUSD', transactionFeeInUSD);

        if (profitInUSD > transactionFeeInUSD) return true;
        return false;
    }
}
