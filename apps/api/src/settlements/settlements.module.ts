import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma.module';
import { SettlementsService } from './settlements.service';
import { SettlementsController } from './settlements.controller';
import { DebtSimplificationModule } from '../debt-simplification/debt-simplification.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, DebtSimplificationModule, NotificationsModule],
  providers: [SettlementsService],
  controllers: [SettlementsController],
  exports: [SettlementsService],
})
export class SettlementsModule {}
