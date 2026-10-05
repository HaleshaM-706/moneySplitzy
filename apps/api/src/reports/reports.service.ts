import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // Pagination helper
  private paginate(query: any, page = 1, pageSize = 50) {
    const take = Math.min(pageSize, 200);
    const skip = (Math.max(page, 1) - 1) * take;
    return { ...query, skip, take };
  }

  // Monthly spending for a user or group (by month)
  async monthlySpending({ groupId, userId, year }: { groupId?: string; userId?: string; year?: number }, page = 1, pageSize = 50) {
    const where: any = {};
    if (groupId) where.groupId = groupId;
    if (userId) where.createdById = userId;
    if (year) {
      const start = new Date(Date.UTC(year, 0, 1));
      const end = new Date(Date.UTC(year + 1, 0, 1));
      where.createdAt = { gte: start, lt: end };
    }

    const rows = await this.prisma.$queryRawUnsafe(`
      SELECT DATE_TRUNC('month', "createdAt") as month, SUM("totalMinor") as total_minor
      FROM "Expense"
      WHERE ${groupId ? "\"groupId\" = '" + groupId + "'" : '1=1'}
      GROUP BY month
      ORDER BY month DESC
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    `);

    return rows;
  }

  async groupSpending({ groupId, from, to, page = 1, pageSize = 50 }: { groupId: string; from?: Date; to?: Date; page?: number; pageSize?: number }) {
    const where: any = { groupId };
    if (from || to) where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lt = to;

    const query = this.paginate({ where, orderBy: { createdAt: 'desc' } }, page, pageSize);
    const expenses = await this.prisma.expense.findMany(query);
    return expenses;
  }

  async individualSpending({ userId, from, to }: { userId: string; from?: Date; to?: Date }) {
    const where: any = { createdById: userId };
    if (from || to) where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lt = to;
    return this.prisma.expense.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async categorySpending({ groupId, category, from, to }: { groupId?: string; category?: string; from?: Date; to?: Date }) {
    // assume Expense has category field in future; fallback to description matching
    const where: any = {};
    if (groupId) where.groupId = groupId;
    if (category) where.description = { contains: category, mode: 'insensitive' };
    if (from || to) where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lt = to;

    return this.prisma.expense.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async expenseHistory({ groupId, userId, q, page = 1, pageSize = 50 }: { groupId?: string; userId?: string; q?: string; page?: number; pageSize?: number }) {
    const where: any = {};
    if (groupId) where.groupId = groupId;
    if (userId) where.createdById = userId;
    if (q) where.description = { contains: q, mode: 'insensitive' };
    const query = this.paginate({ where, orderBy: { createdAt: 'desc' } }, page, pageSize);
    return this.prisma.expense.findMany(query);
  }
}
