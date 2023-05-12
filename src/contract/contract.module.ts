import { Module } from '@nestjs/common';
import { LiquidationBotContractService } from './liquidation-bot-contract.service';
import { LogModule } from 'src/log/log.module';
import { ProviderModule } from 'src/provider/provider.module';
import { ERC20ContractService } from './erc20.service';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [LogModule, ProviderModule],
    controllers: [],
    providers: [LiquidationBotContractService, ERC20ContractService],
    exports: [LiquidationBotContractService, ERC20ContractService],
})
export class ContractModule {}
