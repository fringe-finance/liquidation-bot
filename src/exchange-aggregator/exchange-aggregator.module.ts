import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ExchangeAggregatorService } from './exchange-aggregator.service';
import { ParaswapService } from './paraswap/paraswap.service';
import { ContractModule } from 'src/contract/contract.module';

@Module({
    imports: [
        HttpModule,
        ContractModule
    ],
    controllers: [],
    providers: [ExchangeAggregatorService, ParaswapService, ParaswapService],
    exports: [ExchangeAggregatorService, ParaswapService, ParaswapService],
})
export class ExchangeAggregatorModule {}
