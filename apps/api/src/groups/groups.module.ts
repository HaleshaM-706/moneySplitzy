import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma.module';
import { GroupsController } from './groups.controller';
import { ExpensesController } from './expenses.controller';

@Module({ imports: [PrismaModule], controllers: [GroupsController, ExpensesController] })
export class GroupsModule {}
