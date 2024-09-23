import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ExchangeAggregatorService } from './exchange-aggregator.service';
import { ParaswapService } from './paraswap/paraswap.service';
import { ContractModule } from 'src/contract/contract.module';
import { OpenOceanService } from './open-ocean/open-ocean.service';

@Module({
    imports: [HttpModule, ContractModule],
    controllers: [],
    providers: [ExchangeAggregatorService, ParaswapService, OpenOceanService],
    exports: [ExchangeAggregatorService, ParaswapService, OpenOceanService],
})
export class ExchangeAggregatorModule {}
