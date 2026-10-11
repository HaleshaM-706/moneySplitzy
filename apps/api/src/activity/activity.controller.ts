import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(@Req() req: any) {
    const activities = await this.prisma.expense.findMany({
      where: { group: { members: { some: { userId: req.user.id } } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        group: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
    });

    return activities.map(expense => ({
      id: expense.id,
      title: expense.description || 'Expense',
      amount: expense.totalMinor,
      payerId: expense.createdById,
      paidBy: expense.createdBy.name || undefined,
      createdAt: expense.createdAt,
      groupName: expense.group.name,
      currency: expense.currency,
    }));
  }
}
