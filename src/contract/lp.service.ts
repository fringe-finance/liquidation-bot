import { Injectable } from '@nestjs/common';
import { ProvidersService } from '../provider/provider.service';
import * as LP_ABI from './abi/LP.json';
import { BaseContractService } from './base-contract.service';
import { BigNumberish } from 'ethers';

@Injectable()
export class LPContractService extends BaseContractService {
    constructor(protected readonly providerService: ProvidersService) {
        super(providerService, LP_ABI);
    }

    async convertToAssets(networkId: number, contractAddress: string, amount: BigNumberish) {
        const contract = await this.getContractRead(networkId, contractAddress);
        return await contract.convertToAssets(amount);
    }

    async unwrapLP(networkId: number, contractAddress: string) {
        const contract = await this.getContractRead(networkId, contractAddress);
        const lpTotalSupply = await contract.totalSupply();
        const lpToken0Address = await contract.token0();
        const lpToken1Address = await contract.token1();
        const lpToken0Reserve = await contract.getReserves(lpToken0Address);
        const lpToken1Reserve = await contract.getReserves(lpToken1Address);
        return {
            lpTotalSupply,
            lpToken0Address,
            lpToken1Address,
            lpToken0Reserve,
            lpToken1Reserve
        };
    }

}
