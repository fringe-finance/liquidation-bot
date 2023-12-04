import { Injectable } from '@nestjs/common';
import { ProvidersService } from '../provider/provider.service';
import * as PRICE_AGGREGATOR_ABI from './abi/PriceAggregator.abi.json';
import { BaseContractService } from './base-contract.service';
import { ConfigService } from '@nestjs/config';
import { ExpiredPriceFeed } from './dto/expired-price-feed.dto';
import { EvmPriceServiceConnection } from '@pythnetwork/pyth-evm-js';
import { UpdatePriceData } from './dto/update-price-data.dto';

@Injectable()
export class PriceAggregatorService extends BaseContractService {
    constructor(
        protected readonly providerService: ProvidersService,
        protected readonly config: ConfigService
    ) {
        super(providerService, PRICE_AGGREGATOR_ABI);
    }

    async isUsingPythOracle(networkId: number, contractAddress: string, tokenAddress: string): Promise<boolean> {
        try {
            const contract = await this.getContractRead(networkId, contractAddress);
            const priceProvider = await contract.tokenPriceProvider(tokenAddress);            
            return this.config.get('PYTH_PRICE_PROVIDER_CONTRACT_ADDRESS') === priceProvider.priceProvider;
        } catch (error) {
            throw new Error(`Error when check token is using pyth oracle`);
        }
    }

    async getExpiredPriceFeeds(networkId: number, contractAddress: string, listToken: string[]): Promise<ExpiredPriceFeed> {
        try {
            const contract = await this.getContractRead(networkId, contractAddress);
            return await contract.getExpiredPriceFeeds(listToken, this.config.get('TIME_BEFORE_EXPIRATION'));
        } catch (error) {
            throw new Error(`Error when get expired price feeds`);
        }
    }

    async getUpdatePriceData(networkId: number, contractAddress: string, listTokens: string[]): Promise<UpdatePriceData> {
        
        let updatePriceData: UpdatePriceData = {
            priceIds: [],
            updateData: [],
            updateFee: 0
        }

        let listTokensUsePythOracle = [];
        for (const token of listTokens) {
            const isUsingPythOracle = await this.isUsingPythOracle(
                networkId,
                contractAddress,
                token
            );
            if (isUsingPythOracle) listTokensUsePythOracle.push(token);
        }
        if (listTokensUsePythOracle.length === 0) return updatePriceData;
        const { priceIds, updateFee } = await this.getExpiredPriceFeeds(
            networkId,
            contractAddress,
            listTokensUsePythOracle
        );
        if (priceIds.length === 0) return updatePriceData;

        const connection = new EvmPriceServiceConnection(
            this.config.get('PYTHNET_PRICE_FEED_ENDPOINT')
        );
        let updateData: string[];
        try {
            updateData = await connection.getPriceFeedsUpdateData(priceIds);
        } catch (error) {
            throw new Error(`Error when get price feeds update data from pythnet service`);
        }

        updatePriceData = {
            priceIds: [...priceIds],
            updateData,
            updateFee
        }
        return updatePriceData;
    }
}
