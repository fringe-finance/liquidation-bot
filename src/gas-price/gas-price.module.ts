import { Module } from '@nestjs/common';
import { GasPriceService } from './gas-price.service';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        HttpModule,
        CacheModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                ttl: Number(configService.get('CACHE_TTL')) || 300000,
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [],
    providers: [GasPriceService],
    exports: [GasPriceService],
})
export class GasPriceModule {}
