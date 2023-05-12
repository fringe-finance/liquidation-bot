import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { ERC20ContractService } from 'src/contract/erc20.service';
import { uint256ToNumber } from 'src/helper/common';

@Injectable()
export class PriceTokenService {
    private readonly usdDecimals = 6;
    private readonly ETH = 'ethereum';

    constructor(
        @Inject(CACHE_MANAGER) protected cacheManager: Cache,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {}

    async getTokenPrice(
        chainId: number,
        tokenAddress: string,
        tokenDecimals: number,
        symbol: string,
        tokenValue: string,
        tokenAmount: string,
    ) {
        const tokenAmountInNumber = uint256ToNumber(
            BigInt(tokenAmount),
            tokenDecimals,
        );
        const tokenValueInNumber = uint256ToNumber(
            BigInt(tokenValue),
            this.usdDecimals,
        );
        console.log(
            'Price of',
            symbol,
            ': ',
            tokenValueInNumber / tokenAmountInNumber,
        );
        return tokenValueInNumber / tokenAmountInNumber;
    }

    async getNativeCoinPrice(chainId: number) {
        const nativeCoinId = this.configService.get(
            `COIN_GECKO_NATIVE_COIN_ID`,
        );
        const price = await this.cacheManager.get(`NativeCoinPrice-${chainId}`);
        if (price) return price;
        try {
            const requestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            const url = `https://api.coingecko.com/api/v3/simple/price?ids=${nativeCoinId}&vs_currencies=usd`;
            const response = await this.httpService.axiosRef.get(
                url,
                requestConfig,
            );
            await this.cacheManager.set(
                `NativeCoinPrice-${chainId}`,
                response.data[nativeCoinId].usd,
            );
            return response && response.data[nativeCoinId].usd;
        } catch {
            throw new Error(`Error when get price ${nativeCoinId}`);
        }
    }
}
