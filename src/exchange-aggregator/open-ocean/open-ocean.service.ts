import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { BigNumberish, ethers } from 'ethers';
import * as OOE_ABI from '../../contract/abi/OpenOceanExchange.json';
import { uint256ToNumber } from 'src/helper/common';

@Injectable()
export class OpenOceanService {
    private readonly baseUrl = 'https://open-api.openocean.finance/v3';
    private ifaceOpenOceanExchange = new ethers.Interface(OOE_ABI);
    constructor(private readonly httpService: HttpService) {}

    async createCallDataOpenOcean(
        srcToken: string,
        srcDecimals: BigNumberish,
        srcAmount: BigNumberish,
        destToken: string,
        {
            chainId = '1',
            account,
        }: {
            chainId: string;
            account: string;
        },
        gasPriceInGWei: string,
    ) {
        const { data: priceData } = await this.httpService.axiosRef.get(
            `${this.baseUrl}/${chainId}/swap_quote`,
            {
                params: {
                    chain: chainId,
                    inTokenAddress: srcToken,
                    outTokenAddress: destToken,
                    amount: uint256ToNumber(
                        BigInt(srcAmount),
                        Number(srcDecimals),
                    ),
                    gasPrice: gasPriceInGWei,
                    slippage: '5',
                    account: account,
                },
            },
        );
        let data = '';
        let amount = 0;
        console.log({
            priceData,
        });

        if (priceData?.data?.data) {
            data = priceData.data.data;
            amount = priceData.data.minAmountOut;
        }
        return {
            data,
            amount,
        };
    }

    tryDecodeFuncData(data: string, abi: any[], iface: ethers.Interface) {
        for (let i = 0; i < abi.length; i++) {
            try {
                return iface.decodeFunctionData(abi[i].name, data).desc
                    .guaranteedAmount;
            } catch (error) {
                continue;
            }
        }
        return 0;
    }

    async sellOnOpenOcean(
        tokenIn: string,
        tokenInDecimals: BigNumberish,
        amountIn: BigNumberish,
        tokenOut: string,
        receiver: string,
        chainId: string,
        gasPriceInGWei: string,
    ) {
        const { data, amount } = await this.createCallDataOpenOcean(
            tokenIn,
            tokenInDecimals,
            amountIn,
            tokenOut,
            {
                chainId,
                account: receiver,
            },
            gasPriceInGWei,
        );

        const amountOut = BigInt(amount);
        const buyCallData = data;

        return {
            amountOut,
            buyCallData,
        };
    }

    async buyOnOpenOcean (
        tokenIn: string,
        tokenInDecimals: BigNumberish,
        tokenInAmount: BigNumberish,
        tokenOut: string,
        expectedAmountOut: BigNumberish,
        receiver: string,
        chainId: string,
        maxDiscrepancy: string
      ) {
        if (tokenIn.toLowerCase() === tokenOut.toLowerCase()) {
            return {
                amountIn: expectedAmountOut,
                buyCallData: undefined
            }; 
        }
      
        const sellData = await this.sellOnOpenOcean(
            tokenIn,
            tokenInDecimals,
            tokenInAmount,
            tokenOut,
            receiver,
            chainId,
            "10"
        );
        
        if (
            BigInt(sellData.amountOut) >= BigInt(expectedAmountOut) &&
            BigInt(sellData.amountOut) <= BigInt(expectedAmountOut) * BigInt(110) / BigInt(100)
        ) {
            return {
                amountIn: tokenInAmount,
                buyCallData: sellData.buyCallData
            };
        } else {
            const newTokenInAmount = BigInt(sellData.amountOut) >= BigInt(expectedAmountOut) ?
              BigInt(tokenInAmount) * BigInt(expectedAmountOut) / BigInt(sellData.amountOut) :
              BigInt(tokenInAmount) * BigInt(expectedAmountOut) / BigInt(sellData.amountOut) * BigInt(110) / BigInt(100)
            return await this.buyOnOpenOcean(
                tokenIn,
                tokenInDecimals,
                newTokenInAmount,
                tokenOut,
                expectedAmountOut,
                receiver,
                chainId,
                maxDiscrepancy
            );
        }
      };
}
