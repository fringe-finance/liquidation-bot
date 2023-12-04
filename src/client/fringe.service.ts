import { Injectable } from '@nestjs/common';
import * as LiquidatePositions from 'primary-scripts';
import { LiquidationPosition } from './dto/liquidate-position.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FringeService {
    private readonly liquidatePosition;

    constructor(private readonly configService: ConfigService) {
        this.liquidatePosition = new LiquidatePositions(
            this.configService.get('NETWORK_RPC'),
            this.configService.get('PIT_CONTRACT_ADDRESS'),
            this.configService.get('PIT_LIQUIDATION_CONTRACT_ADDRESS'),
            this.configService.get('PIT_SUBGRAPH_URL'),
            this.configService.get('PRICE_AGGREGATOR_CONTRACT_ADDRESS'),
            this.configService.get('PYTH_PRICE_PROVIDER_CONTRACT_ADDRESS'),
            this.configService.get('TIME_BEFORE_EXPIRATION'),
            this.configService.get('PYTHNET_PRICE_FEED_ENDPOINT')
        );
    }

    async getLiquidatePositions(): Promise<LiquidationPosition> {
        const lp = await this.liquidatePosition.getLiquidatePositions();
        return lp;
    }
}
