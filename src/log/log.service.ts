import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as log4js from 'log4js';

@Injectable()
export class LogService {
    constructor(private readonly configService: ConfigService) {
        const logFolder = this.configService.get('LOG_DIR') || './logs';
        log4js.configure({
            appenders: {
                common: {
                    type: 'dateFile',
                    filename: `${logFolder}/logs.log`,
                    pattern: 'yyyy-MM-dd',
                    compress: true,
                    keepFileExt: true,
                    numBackups: 15,
                },
            },
            categories: { default: { appenders: ['common'], level: 'trace' } },
        });
    }

    log(message: any, ...args: any[]) {
        const logger = log4js.getLogger();
        if (args.length > 0) {
            logger.log(message, args);
            console.log(message, args);
        } else {
            logger.log(message);
            console.log(message);
        }
    }

    debug(message: any, ...args: any[]) {
        const logger = log4js.getLogger();
        if (args.length > 0) {
            logger.debug(message, args);
            console.log(message, args);
        } else {
            logger.debug(message);
            console.log(message);
        }
    }

    error(message: any, ...args: any[]) {
        const logger = log4js.getLogger();
        if (args.length > 0) {
            logger.error(message, args);
            console.log(message, args);
        } else {
            logger.error(message);
            console.log(message);
        }
    }
}
