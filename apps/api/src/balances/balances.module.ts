import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma.module';
import { BalancesService } from './balances.service';

@Module({
  imports: [PrismaModule],
  providers: [BalancesService],
  exports: [BalancesService]
})
export class BalancesModule {}
