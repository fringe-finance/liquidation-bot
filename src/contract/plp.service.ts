import { Injectable } from '@nestjs/common';
import { ProvidersService } from '../provider/provider.service';
import * as PLP_ABI from './abi/PrimaryLendingPlatform.json';
import { BaseContractService } from './base-contract.service';
import { ConfigService } from '@nestjs/config';
import { BigNumberish } from 'ethers';

@Injectable()
export class PlpService extends BaseContractService {
    constructor(
        protected readonly providerService: ProvidersService,
        protected readonly config: ConfigService,
    ) {
        super(providerService, PLP_ABI);
    }

    async getTokenEvaluation(
        networkId: number,
        contractAddress: string,
        tokenAddress: string,
        tokenAmount: BigNumberish,
        priceIds: string[],
        updateData: string[],
        updateFee: BigNumberish,
    ) {
        try {
            const contract = await this.getContractRead(
                networkId,
                contractAddress,
            );
            return await contract.getTokenEvaluationWithUpdatePrices.staticCall(
                tokenAddress,
                tokenAmount,
                priceIds,
                updateData,
                { value: updateFee },
            );
        } catch (error) {
            throw new Error(`Error when get token evaluation`);
        }
    }

    async getbLendingToken(
        networkId: number,
        contractAddress: string,
        tokenAddress: string,
    ) {
        try {
            const contract = await this.getContractRead(
                networkId,
                contractAddress,
            );
            return await contract.lendingTokenInfo.staticCall(tokenAddress);
        } catch (error) {
            throw new Error(`Error when get bLending token`);
        }
    }

    async getTokensUpdateFinalPrices(
        networkId: number,
        contractAddress: string,
        projectAddress: string,
        lendingAddress: string,
    ) {
        try {
            const contract = await this.getContractRead(
                networkId,
                contractAddress,
            );
            return await contract.getTokensUpdateFinalPrices.staticCall(
                projectAddress,
                lendingAddress,
                true,
            );
        } catch (error) {
            throw new Error(`Error when get tokens update final prices`);
        }
    }
}
