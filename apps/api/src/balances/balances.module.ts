import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma.module';
import { BalancesService } from './balances.service';
import { BalancesController } from './balances.controller';

@Module({
  imports: [PrismaModule],
  providers: [BalancesService],
  controllers: [BalancesController],
  exports: [BalancesService]
})
export class BalancesModule {}
