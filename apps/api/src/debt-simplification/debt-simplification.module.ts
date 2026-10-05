import { Module } from '@nestjs/common';
import { DebtSimplificationService } from './debt-simplification.service';
import { PrismaModule } from '../common/prisma.module';

@Module({ imports: [PrismaModule], providers: [DebtSimplificationService], exports: [DebtSimplificationService] })
export class DebtSimplificationModule {}
