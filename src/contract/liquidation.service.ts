import { PriceAggregatorService } from 'src/contract/price-aggregator.service';
import { ProvidersService } from '../provider/provider.service';
import { Injectable } from '@nestjs/common';
import * as LIQUIDATION_ABI from './abi/liquidation.json';
import { BaseContractService } from './base-contract.service';
import { LogService } from 'src/log/log.service';
import { LiquidateParams, TokenType } from './dto/liquidate-params.dto';
import { ZERO_ADDRESS } from 'src/helper/constants/address';
import { ExchangeType } from 'src/helper/enums/dex';
import { BigNumberish } from 'ethers';
import { PlpService } from './plp.service';

@Injectable()
export class LiquidationContractService extends BaseContractService {
    constructor(
        protected readonly providersService: ProvidersService,
        protected readonly logService: LogService,
        protected readonly plpService: PlpService,
    ) {
        super(providersService, LIQUIDATION_ABI);
    }

    async estimateGas(
        chainId: number,
        contractAddress: string,
        params: LiquidateParams,
    ) {
        try {
            const liquidationContract = await this.getContractWrite(
                chainId,
                contractAddress,
            );
            if (!liquidationContract) {
                this.logService.log("Can't get contract instance");
                return;
            }
            const tuple = this.getLiquidationInput(params);
            const gas = await liquidationContract.liquidate.estimateGas(
                ...tuple,
                {
                    value: params.updateFee,
                },
            );
            if (!gas || Number(gas) == 0) {
                this.logService.error('Estimate gas fail!');
            }
            return gas;
        } catch (e) {
            throw new Error('Error when estimate liquidate position');
        }
    }

    async liquidate(
        chainId: number,
        contractAddress: string,
        params: LiquidateParams,
        gasLimit: BigNumberish,
        gasPrice: BigNumberish,
    ) {
        try {
            const liquidationContract = await this.getContractWrite(
                chainId,
                contractAddress,
            );
            if (!liquidationContract) {
                this.logService.log("Can't get contract instance");
                return;
            }
            const tuple = this.getLiquidationInput(params);
            const tx = await liquidationContract.liquidate(...tuple, {
                gasLimit,
                gasPrice,
                value: params.updateFee,
            });
            this.logService.log('Transaction hash: ', tx.hash);
            return tx.wait(2);
        } catch (e) {
            this.logService.error('Error when liquidate position: ', e);
        }
    }

    async getEstimatedCollateralReward(
        chainId: number,
        liquidationAddress: string,
        plpAddress: string,
        params: LiquidateParams,
    ) {
        try {
            const liquidationContract = await this.getContractWrite(
                chainId,
                liquidationAddress,
            );
            if (!liquidationContract) {
                this.logService.log("Can't get contract instance");
                return;
            }
            const tuple = this.getLiquidationInput(params);

            const { assets, assetAmounts } =
                await liquidationContract.liquidate.staticCall(...tuple, {
                    value: params.updateFee,
                });

            let totalReward = BigInt(0);

            if (params.collateralInfo.tokenType == TokenType.ERC20) {
                const { collateralEvaluation } =
                    await this.plpService.getTokenEvaluation(
                        chainId,
                        plpAddress,
                        assets[0],
                        assetAmounts[0],
                        params.priceIds,
                        params.updateData,
                        params.updateFee,
                    );
                totalReward += collateralEvaluation;

                for (let i = 1; i < assets.length; i++) {
                    const { capitalEvaluation } =
                        await this.plpService.getTokenEvaluation(
                            chainId,
                            plpAddress,
                            assets[i],
                            assetAmounts[i],
                            params.priceIds,
                            params.updateData,
                            params.updateFee,
                        );
                    totalReward += capitalEvaluation;
                }
            } else if (
                params.collateralInfo.tokenType == TokenType.LP ||
                params.collateralInfo.tokenType == TokenType.ERC4626
            ) {
                for (let i = 0; i < 2; i++) {
                    const { collateralEvaluation } =
                        await this.plpService.getTokenEvaluation(
                            chainId,
                            plpAddress,
                            assets[i],
                            assetAmounts[i],
                            params.priceIds,
                            params.updateData,
                            params.updateFee,
                        );
                    totalReward += collateralEvaluation;
                }

                for (let i = 2; i < assets.length; i++) {
                    const { capitalEvaluation } =
                        await this.plpService.getTokenEvaluation(
                            chainId,
                            plpAddress,
                            assets[i],
                            assetAmounts[i],
                            params.priceIds,
                            params.updateData,
                            params.updateFee,
                        );
                    totalReward += capitalEvaluation;
                }
            }
            return totalReward;
        } catch (e) {
            throw new Error('Error when get estimated collateral reward');
        }
    }

    async getLiquidationAmount(
        chainId: number,
        contractAddress: string,
        borrower: string,
        collateral: string,
        lending: string,
        priceIds: string[],
        updateData: string[],
        updateFee: BigNumberish,
    ) {
        try {
            const liquidationContract = await this.getContractRead(
                chainId,
                contractAddress,
            );

            const result =
                await liquidationContract.getLiquidationAmountWithUpdatePrices.staticCall(
                    borrower,
                    collateral,
                    lending,
                    priceIds,
                    updateData,
                    {
                        value: updateFee,
                    },
                );

            return { minLA: result?.minLA, maxLA: result?.maxLA };
        } catch (error) {
            throw new Error('Errow when get liquidation amount');
        }
    }

    async getExchangeAggregatorType(
        chainId: number,
        contractAddress: string,
    ): Promise<ExchangeType> {
        try {
            const liquidationContract = await this.getContractRead(
                chainId,
                contractAddress,
            );
            if (!liquidationContract) {
                this.logService.log("Can't get contract instance");
                return;
            }

            const registryAggregator =
                await liquidationContract.registryAggregator();
            if (!registryAggregator || registryAggregator == ZERO_ADDRESS) {
                return ExchangeType.OpenOcean;
            } else {
                return ExchangeType.Paraswap;
            }
        } catch (e) {
            this.logService.error('Error when get exchange aggregator: ', e);
        }
    }

    async getLiquidatorAddress(networkId: number) {
        try {
            const signer = await this.providersService.getSigner(networkId);
            return await signer.getAddress();
        } catch (error) {
            throw new Error('Error when get liquidator address');
        }
    }

    private getLiquidationInput(params: LiquidateParams) {
        const tuple = [
            params.borrower,
            [params.collateralInfo.addr, params.collateralInfo.tokenType],
            [params.lendingInfo.addr, params.lendingInfo.tokenType],
            params.liquidationAmount,
            params.priceIds,
            params.updateData,
            params.buyCalldata,
        ];
        return tuple;
    }
}
