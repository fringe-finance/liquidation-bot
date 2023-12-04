import { ProvidersService } from '../provider/provider.service';
import { Inject, Injectable } from '@nestjs/common';
import * as LIQUIDATION_BOT_ABI from './abi/liquidation-bot-abi.json';
import { BaseContractService } from './base-contract.service';
import { LogService } from 'src/log/log.service';
import { FlashSwapParams } from './dto/flash-swap-param.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class LiquidationBotContractService extends BaseContractService {
    constructor(
        private readonly providersService: ProvidersService,
        private readonly logService: LogService,
    ) {
        super(providersService, LIQUIDATION_BOT_ABI);
    }

    async estimateGas(
        chainId: number,
        contractAddress: string,
        params: FlashSwapParams,
    ) {
        try {
            const liquidationBotContract = await this.getContractWrite(
                chainId,
                contractAddress,
            );
            if (!liquidationBotContract) {
                this.logService.log("Can't get contract instance");
                return;
            }
            const tuple = this._getInitFlashInput(params);
            
            const gas = await liquidationBotContract.initFlash.estimateGas(
                tuple, { value: params.liquidateParam.updateFee }
            );
            if (!gas || Number(gas) == 0) {
                this.logService.error('Estimate gas fail!');
            }
            return gas;
        } catch (e) {
            this.logService.error('Error when estimate init flash loan: ', e);
        }
    }

    async initFlash(
        chainId: number,
        contractAddress: string,
        params: FlashSwapParams,
        gasLimit,
        gasPrice,
    ) {
        try {
            const liquidationBotContract = await this.getContractWrite(
                chainId,
                contractAddress,
            );
            if (!liquidationBotContract) {
                this.logService.log("Can't get contract instance");
                return;
            }
            const tuple = this._getInitFlashInput(params);
            const tx = await liquidationBotContract.initFlash(tuple, {
                gasLimit,
                gasPrice,
                value: params.liquidateParam.updateFee
            });
            return tx.wait(1);
        } catch (e) {
            this.logService.error('Error when init flash loan: ', e);
        }
    }

    async getAmountCollateralRequired(
        chainId: number,
        contractAddress: string,
        collateralTokenAddress: string,
        lendingTokenAddress: string,
        lendingTokenFlashLoan: string,
    ) {
        try {
            const liquidationBotContract = await this.getContractRead(
                chainId,
                contractAddress,
            );
            if (!liquidationBotContract) {
                this.logService.log("Can't get contract instance");
                return;
            }
            const amountRequired =
                await liquidationBotContract.getAmountRequired(
                    collateralTokenAddress,
                    lendingTokenAddress,
                    BigInt(lendingTokenFlashLoan),
                );

            return amountRequired;
        } catch (e) {
            this.logService.error(
                'Error when get amount collateral required: ',
                e,
            );
        }
    }

    private _getInitFlashInput(params: FlashSwapParams) {
        const tuple = [
            params.token0,
            params.token1,
            params.amount0,
            params.amount1,
            [
                params.liquidateParam.borrower,
                params.liquidateParam.collateralToken,
                params.liquidateParam.lendingToken,
                params.liquidateParam.priceIds,
                params.liquidateParam.updateData,
                params.liquidateParam.updateFee
            ],
        ];
        return tuple;
    }
}
