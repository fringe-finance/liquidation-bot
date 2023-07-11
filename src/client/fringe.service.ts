import { Injectable } from '@nestjs/common';
import * as LiquidatePositions from '@fringefinance/primary-scripts';
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
        );
    }

    async getLiquidatePositions(): Promise<LiquidationPosition> {
        const lp = await this.liquidatePosition.getLiquidatePositions();
        return lp;
    }
}
