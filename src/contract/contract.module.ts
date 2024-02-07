import { Module } from '@nestjs/common';
import { LiquidationBotContractService } from './liquidation-bot-contract.service';
import { LogModule } from 'src/log/log.module';
import { ProviderModule } from 'src/provider/provider.module';
import { ERC20ContractService } from './erc20.service';
import { PriceAggregatorService } from './price-aggregator.service';

@Module({
    imports: [LogModule, ProviderModule],
    controllers: [],
    providers: [LiquidationBotContractService, ERC20ContractService, PriceAggregatorService],
    exports: [LiquidationBotContractService, ERC20ContractService, PriceAggregatorService],
})
export class ContractModule {}
