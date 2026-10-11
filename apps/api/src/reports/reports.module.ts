import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma.module';
import { ReportsService } from './reports.service';
import { GroupReportsController, ReportsController } from './reports.controller';

@Module({
  imports: [PrismaModule],
  providers: [ReportsService],
  controllers: [ReportsController, GroupReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
