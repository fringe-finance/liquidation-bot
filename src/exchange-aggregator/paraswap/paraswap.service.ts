import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { BigNumberish } from 'ethers';

@Injectable()
export class ParaswapService {
  private readonly baseUrl = 'https://apiv5.paraswap.io';

  constructor(private readonly httpService: HttpService) {}

  async createCallDataParaswap(
    srcToken: string,
    srcDecimals: number,
    destToken: string,
    destDecimals: number,
    amountTokenBN: string,
    side: string,
    {
      chainId = 1,
      account,
    }: {
      chainId: number;
      account: string;
    },
    maxDiscrepancy: string = '0.05',
  ) {
    const { data: priceData } = await this.httpService.axiosRef.get(`${this.baseUrl}/prices/`, {
      params: {
        srcToken,
        srcDecimals,
        destDecimals,
        amount: amountTokenBN,
        destToken,
        side,
        network: +chainId,
      },
    });

    const slippage = Math.round(Number(maxDiscrepancy) * 10000);
    const txDataBody = {
      ...priceData,
      srcToken,
      destToken,
      slippage,
      [side === 'BUY' ? `destAmount` : `srcAmount`]: amountTokenBN,
      userAddress: account,
    };

    const { data: txData } = await this.httpService.axiosRef.post(
      `${this.baseUrl}/transactions/${+chainId}/`,
      txDataBody,
      {
        params: { ignoreChecks: true },
      },
    );
    const amount = side === 'SELL' ? priceData.priceRoute.destAmount : priceData.priceRoute.srcAmount;
    return {
      data: txData.data ? txData.data : '',
      amount: amount || 0,
    };
  }

  async buyOnParaswap(
    tokenIn: string,
    tokenInDecimals: BigNumberish,
    tokenOut: string,
    tokenOutDecimals: BigNumberish,
    amountOut: BigNumberish,
    receiver: string,
    chainId: string,
    maxDiscrepancy: string,
  ) {
    const { data, amount } = await this.createCallDataParaswap(
      tokenIn,
      Number(tokenInDecimals),
      tokenOut,
      Number(tokenOutDecimals),
      amountOut.toString(),
      'BUY',
      {
        chainId: Number(chainId),
        account: receiver,
      },
      maxDiscrepancy,
    );

    const amountIn = BigInt(amount);
    const buyCallData = data;
    return {
      amountIn,
      buyCallData,
    };
  }

  async sellOnParaswap(
    tokenIn: string,
    tokenInDecimals: BigNumberish,
    amountIn: BigNumberish,
    tokenOut: string,
    tokenOutDecimals: BigNumberish,
    receiver: string,
    chainId: string,
    maxDiscrepancy: string,
  ) {
    const { data, amount } = await this.createCallDataParaswap(
      tokenIn,
      Number(tokenInDecimals),
      tokenOut,
      Number(tokenOutDecimals),
      amountIn.toString(),
      'SELL',
      {
        chainId: Number(chainId),
        account: receiver,
      },
      maxDiscrepancy,
    );

    const amountOut = BigInt(amount);
    const buyCallData = data;

    return {
      amountOut,
      buyCallData,
    };
  }
}
