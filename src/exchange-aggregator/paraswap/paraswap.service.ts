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
    ) {
        const { data: priceData } = await this.httpService.axiosRef.get(
            `${this.baseUrl}/prices/`,
            {
                params: {
                    srcToken,
                    srcDecimals,
                    destDecimals,
                    amount: amountTokenBN,
                    destToken,
                    side,
                    network: +chainId,
                },
            },
        );

        const txDataBody = {
            ...priceData,
            srcToken,
            destToken,
            slippage: '5',
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
        const amount =
            side === 'SELL'
                ? priceData.priceRoute.destAmount
                : priceData.priceRoute.srcAmount;
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
        );

        const amountOut = BigInt(amount);
        const buyCallData = data;

        return {
            amountOut,
            buyCallData,
        };
    }
}
