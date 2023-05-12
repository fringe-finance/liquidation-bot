import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GasPriceResponse } from './dto/gas-price-response.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class GasPriceService {
    private readonly baseURL: string;
    private readonly apiKey: string;

    constructor(
        @Inject(CACHE_MANAGER) protected cacheManager: Cache,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.baseURL = this.configService.get('EXPLORER_SCAN_API_URL');
        this.apiKey = this.configService.get('EXPLORER_SCAN_API_KEY');
    }

    async getGasPrice() {
        try {
            const garPrice = await this.cacheManager.get<bigint>('gasPrice');
            if (garPrice) return garPrice;
            const requestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            const url = `${this.baseURL}?module=proxy&action=eth_gasPrice&apikey=${this.apiKey}`;
            const response =
                await this.httpService.axiosRef.get<GasPriceResponse>(
                    url,
                    requestConfig,
                );
            await this.cacheManager.set(
                'gasPrice',
                BigInt(parseInt(response.data.result, 16)),
            );
            return response && BigInt(parseInt(response.data.result, 16));
        } catch {
            throw new Error('Error when estimate arrival time');
        }
    }
}
