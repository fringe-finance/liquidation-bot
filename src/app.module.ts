import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskModule } from './task/task.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        TaskModule,
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: './.env',
        }),
    ],
    controllers: [],
    providers: [AppService],
})
export class AppModule {}
