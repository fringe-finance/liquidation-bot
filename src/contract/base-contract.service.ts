import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { ethers } from 'ethers';

@Injectable()
export abstract class BaseContractService {
    protected readonly abi;

    constructor(protected readonly providerService, contractAbi: any) {
        this.abi = contractAbi;
    }

    protected async getContractRead(
        networkId: number,
        contractAddress: string,
    ) {
        const provider = await this.providerService.getProvider(networkId);
        const contract = new ethers.Contract(
            contractAddress,
            this.abi,
            provider,
        );
        if (contract) {
            return contract;
        }
        return null;
    }

    protected async getContractWrite(
        networkId: number,
        contractAddress: string,
    ) {
        const signer = await this.providerService.getSigner(networkId);
        const contract = new ethers.Contract(contractAddress, this.abi, signer);
        if (contract) {
            return contract;
        }
        return null;
    }
}
