import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
import { BalancesModule } from './balances/balances.module';
import { SettlementsModule } from './settlements/settlements.module';
import { DebtSimplificationModule } from './debt-simplification/debt-simplification.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { GroupsModule } from './groups/groups.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ActivityModule } from './activity/activity.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    BalancesModule,
    SettlementsModule,
    DebtSimplificationModule,
    NotificationsModule,
    ReportsModule,
    GroupsModule,
    DashboardModule,
    ActivityModule,
    ThrottlerModule.forRoot({ ttl: 60, limit: 120 })
  ],
  controllers: [HealthController],
})
export class AppModule {}
