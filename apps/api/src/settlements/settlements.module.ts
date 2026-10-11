import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma.module';
import { SettlementsService } from './settlements.service';
import { SettlementsController } from './settlements.controller';
import { DebtSimplificationModule } from '../debt-simplification/debt-simplification.module';

@Module({
  imports: [PrismaModule, DebtSimplificationModule],
  providers: [SettlementsService],
  controllers: [SettlementsController],
  exports: [SettlementsService],
})
export class SettlementsModule {}
