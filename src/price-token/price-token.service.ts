import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { uint256ToNumber } from 'src/helper/common';

@Injectable()
export class PriceTokenService {
  private readonly baseUrl = 'https://pro-api.coinmarketcap.com/v2';

  constructor(
    @Inject(CACHE_MANAGER) protected cacheManager: Cache,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getNativeCoinPrice(chainId: number) {
    const nativeCoinId = this.configService.get(`COIN_MARKETCAP_NATIVE_COIN_ID`);
    const convert_id = this.configService.get('COIN_MARKETCAP_CONVERT_ID');
    const price = await this.cacheManager.get(`NativeCoinPrice-${chainId}`);
    if (price) return price;
    try {
      const requestConfig = {
        headers: {
          Accept: 'application/json',
          'X-CMC_PRO_API_KEY': this.configService.get('COIN_MARKETCAP_API_KEY'),
        },
        params: {
          id: nativeCoinId,
          convert_id,
        },
      };
      const url = `${this.baseUrl}/cryptocurrency/quotes/latest`;

      const response = await this.httpService.axiosRef.get(url, requestConfig);

      await this.cacheManager.set(
        `NativeCoinPrice-${chainId}`,
        response.data.data[nativeCoinId].quote[convert_id].price,
      );
      return response && response.data.data[nativeCoinId].quote[convert_id].price;
    } catch {
      throw new Error(`Error when get price ${nativeCoinId}`);
    }
  }
}
