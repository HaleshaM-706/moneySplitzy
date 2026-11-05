import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../common/prisma.module';
import { GroupsController } from './groups.controller';
import { ExpensesController } from './expenses.controller';

@Module({ imports: [PrismaModule, AuthModule], controllers: [GroupsController, ExpensesController] })
export class GroupsModule {}
