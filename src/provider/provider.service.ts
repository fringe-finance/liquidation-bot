import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { ethers } from 'ethers';
import { stringToArray } from 'src/helper/common';
import { LogService } from 'src/log/log.service';

@Injectable()
export class ProvidersService {
    protected chainNetworkIds: number[] = [];
    protected chainIdToRpcUrl: Map<number, string[]> = new Map();
    protected chainIdToProvider: Map<number, ethers.JsonRpcProvider> =
        new Map();
    private readonly walletPrivateKey: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly logService: LogService,
    ) {
        const networkIds = stringToArray(
            this.configService.get('NETWORK_ID'),
            ',',
        );
        networkIds.forEach((chainId: string, index: number) => {
            const rpcList = stringToArray(
                this.configService.get(`NETWORK_RPC`),
                ',',
            );
            this.chainIdToRpcUrl.set(Number(chainId), rpcList);
        });
        this.chainNetworkIds = networkIds.map((id) => Number(id));
        this.walletPrivateKey = this.configService.get(
            'LIQUIDATOR_PRIVATE_KEY',
        );
    }

    async getProvider(chainNetworkId: number) {
        const provider = this.chainIdToProvider[chainNetworkId];
        if (provider) {
            const { chainId } = await provider.getNetwork();
            if (chainId) return provider;
        }
        const rpcList = this.chainIdToRpcUrl.get(chainNetworkId);
        if (rpcList) {
            for (let i = 0; i < rpcList.length; i++) {
                const provider = new ethers.JsonRpcProvider(rpcList[i]);
                const { chainId } = await provider.getNetwork();
                this.logService.log('Get provider!');
                if (chainId) {
                    return provider;
                }
            }
        }
        this.logService.log("Can't get provider!!!!");
        return null;
    }

    async getSigner(chainNetworkId: number) {
        const provider = await this.getProvider(chainNetworkId);
        const signer = new ethers.Wallet(this.walletPrivateKey, provider);
        if (!signer) {
            this.logService.log("Can't get signer!");
        }
        this.logService.log('Get signer!');
        return signer;
    }

    getSupportChainNetworks(): number[] {
        return this.chainNetworkIds;
    }
}
