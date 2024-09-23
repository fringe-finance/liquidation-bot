import { Inject, Injectable } from '@nestjs/common';
import { ProvidersService } from '../provider/provider.service';
import * as ERC20_ABI from './abi/ERC20.json';
import { BaseContractService } from './base-contract.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { BigNumberish, ethers } from 'ethers';

@Injectable()
export class ERC20ContractService extends BaseContractService {
    constructor(protected readonly providerService: ProvidersService) {
        super(providerService, ERC20_ABI);
    }

    async tokenInfo(networkId: number, contractAddress: string) {
        const contract = await this.getContractRead(networkId, contractAddress);
        const decimals = contract && (await contract.decimals());
        const symbol = contract && (await contract.symbol());
        return {
            decimals: Number(decimals),
            symbol,
        };
    }

    async getFeeData(networkId: number) {
        try {
            const data = await fetch(
                `https://api.blocknative.com/gasprices/blockprices?chainid=${networkId}&confidenceLevels=90`,
            );
            const result = await data.json();
            return result.blockPrices[0].estimatedPrices[0];
        } catch (error) {
            console.log(error);
        }
    }

    async allowance(
        networkId: number,
        contractAddress: string,
        owner: string,
        spender: string,
    ) {
        const contract = await this.getContractRead(networkId, contractAddress);
        return await contract.allowance(owner, spender);
    }

    async approve(
        networkId: number,
        contractAddress: string,
        spender: string,
        amount: BigNumberish,
    ) {
        try {
            const contract = await this.getContractWrite(
                networkId,
                contractAddress,
            );
            const feeData = await this.getFeeData(networkId);
            return await contract.approve(spender, amount, {
                maxPriorityFeePerGas: ethers.parseUnits(
                    feeData.maxPriorityFeePerGas.toString(),
                    'gwei',
                ),
                maxFeePerGas: ethers.parseUnits(
                    feeData.maxFeePerGas.toString(),
                    'gwei',
                ),
            });
        } catch (error) {
            throw new Error('Error when approve');
        }
    }
}
