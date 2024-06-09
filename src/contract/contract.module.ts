import { Module } from '@nestjs/common';
import { LiquidationContractService } from './liquidation.service';
import { LogModule } from 'src/log/log.module';
import { ProviderModule } from 'src/provider/provider.module';
import { ERC20ContractService } from './erc20.service';
import { PriceAggregatorService } from './price-aggregator.service';
import { PlpService } from './plp.service';
import { ERC4626ContractService } from './erc4626.service';
import { LPContractService } from './lp.service';

@Module({
    imports: [LogModule, ProviderModule],
    controllers: [],
    providers: [
        LiquidationContractService,
        ERC20ContractService,
        ERC4626ContractService,
        LPContractService,
        PriceAggregatorService,
        PlpService,
    ],
    exports: [
        LiquidationContractService,
        ERC20ContractService,
        ERC4626ContractService,
        LPContractService,
        PriceAggregatorService,
        PlpService,
    ],
})
export class ContractModule {}
