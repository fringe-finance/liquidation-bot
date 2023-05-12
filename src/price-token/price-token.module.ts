import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PriceTokenService } from './price-token.service';
import { ContractModule } from 'src/contract/contract.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        HttpModule,
        ContractModule,
        CacheModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                ttl: Number(configService.get('CACHE_TTL')) || 300000,
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [],
    providers: [PriceTokenService],
    exports: [PriceTokenService],
})
export class PriceTokenModule {}
