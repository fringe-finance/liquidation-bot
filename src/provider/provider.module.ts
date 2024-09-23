import { CacheModule } from '@nestjs/cache-manager';
import { ProvidersService } from './provider.service';
import { Module } from '@nestjs/common';
import { LogModule } from 'src/log/log.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [LogModule],
    controllers: [],
    providers: [ProvidersService],
    exports: [ProvidersService],
})
export class ProviderModule {}
