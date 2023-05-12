import { Module } from '@nestjs/common';
import { FringeService } from './fringe.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [],
    controllers: [],
    providers: [FringeService],
    exports: [FringeService],
})
export class FringeModule {}
