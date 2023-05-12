import { Module } from '@nestjs/common';
import { LiquidateService } from './liquidate.service';
import { LogModule } from 'src/log/log.module';
import { ContractModule } from 'src/contract/contract.module';
import { FringeModule } from 'src/client/fringe.module';
import { GasPriceModule } from 'src/gas-price/gas-price.module';
import { PriceTokenModule } from 'src/price-token/price-token.module';

@Module({
    imports: [
        LogModule,
        ContractModule,
        FringeModule,
        GasPriceModule,
        PriceTokenModule,
    ],
    providers: [LiquidateService],
})
export class TaskModule {}
