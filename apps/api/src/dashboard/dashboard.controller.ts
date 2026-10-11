import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private prisma: PrismaService) {}

  @Get('summary')
  async summary(@Req() req: any) {
    return this.getSummary(req.user.id);
  }

  @Get(':groupId/summary')
  async groupSummary(
    @Req() req: any,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ) {
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: req.user.id } },
      select: { id: true },
    });
    if (!membership) throw new NotFoundException('Group not found');
    return this.getSummary(req.user.id, groupId);
  }

  private async getSummary(userId: string, groupId?: string) {
    const groups = await this.prisma.group.findMany({
      where: {
        ...(groupId ? { id: groupId } : {}),
        members: { some: { userId } },
      },
      select: { id: true, currency: true },
    });
    const groupIds = groups.map(group => group.id);
    const balances = new Map<string, number>();

    for (const group of groups) {
      if (!balances.has(group.currency)) balances.set(group.currency, 0);
    }

    if (groupIds.length > 0) {
      const [payments, splits, settlements] = await Promise.all([
        this.prisma.expensePayment.findMany({
          where: { userId, expense: { groupId: { in: groupIds } } },
          select: { amountMinor: true, expense: { select: { group: { select: { currency: true } } } } },
        }),
        this.prisma.expenseSplit.findMany({
          where: { userId, expense: { groupId: { in: groupIds } } },
          select: { amountMinor: true, expense: { select: { group: { select: { currency: true } } } } },
        }),
        this.prisma.settlement.findMany({
          where: {
            status: 'COMPLETED',
            OR: [{ fromUserId: userId }, { toUserId: userId }],
            groupId: { in: groupIds },
          },
          select: { amountMinor: true, currency: true, fromUserId: true },
        }),
      ]);

      for (const payment of payments) {
        const currency = payment.expense.group.currency;
        balances.set(currency, (balances.get(currency) || 0) + payment.amountMinor);
      }
      for (const split of splits) {
        const currency = split.expense.group.currency;
        balances.set(currency, (balances.get(currency) || 0) - split.amountMinor);
      }
      for (const settlement of settlements) {
        const sign = settlement.fromUserId === userId ? 1 : -1;
        balances.set(settlement.currency, (balances.get(settlement.currency) || 0) + sign * settlement.amountMinor);
      }
    }

    return {
      groupsCount: groups.length,
      balances: [...balances].map(([currency, totalBalance]) => ({ currency, totalBalance })),
    };
  }
}
