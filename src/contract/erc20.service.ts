import { Inject, Injectable } from '@nestjs/common';
import { ProvidersService } from '../provider/provider.service';
import * as ERC20_ABI from './abi/IERC20.abi.json';
import { BaseContractService } from './base-contract.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

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
}
