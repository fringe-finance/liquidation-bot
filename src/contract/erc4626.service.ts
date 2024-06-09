import { Injectable } from '@nestjs/common';
import { ProvidersService } from '../provider/provider.service';
import * as ERC4626_ABI from './abi/ERC4626.json';
import { BaseContractService } from './base-contract.service';
import { BigNumberish } from 'ethers';

@Injectable()
export class ERC4626ContractService extends BaseContractService {
    constructor(protected readonly providerService: ProvidersService) {
        super(providerService, ERC4626_ABI);
    }

    async convertToAssets(networkId: number, contractAddress: string, amount: BigNumberish) {
        const contract = await this.getContractRead(networkId, contractAddress);
        return await contract.convertToAssets(amount);
    }

    async convertToShares(networkId: number, contractAddress: string, amount: BigNumberish) {
        const contract = await this.getContractRead(networkId, contractAddress);
        return await contract.convertToShares(amount);
    }
}
