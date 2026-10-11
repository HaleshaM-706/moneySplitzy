import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
    const take = Math.min(Math.max(pageSize, 1), 200);
    const skip = (Math.max(page, 1) - 1) * take;
    const rows = await this.prisma.$queryRaw<
      { month: Date; currency: string; total_minor: bigint }[]
    >`
      SELECT DATE_TRUNC('month', "createdAt") as month, "currency", SUM("totalMinor") as total_minor
      FROM "Expense"
      WHERE (${groupId ?? null}::text IS NULL OR "groupId" = ${groupId ?? null})
        AND (${userId ?? null}::text IS NULL OR "createdById" = ${userId ?? null})
        AND (${year ?? null}::int IS NULL OR EXTRACT(YEAR FROM "createdAt") = ${year ?? null})
        AND "status" <> 'CANCELLED'
      GROUP BY month, "currency"
      ORDER BY month DESC, "currency"
      LIMIT ${take} OFFSET ${skip}
    `;
    return rows.map(row => {
      const totalMinor = Number(row.total_minor);
      if (!Number.isSafeInteger(totalMinor)) {
        throw new InternalServerErrorException('Monthly total exceeds the supported integer range');
      }
      return { month: row.month, currency: row.currency, total_minor: totalMinor };
    });
  }

  async groupSpending({ groupId, from, to, page = 1, pageSize = 50 }: { groupId: string; from?: Date; to?: Date; page?: number; pageSize?: number }) {
    const where: any = { groupId, status: { not: 'CANCELLED' } };
    if (from || to) where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lt = to;

    const query = this.paginate({ where, orderBy: { createdAt: 'desc' } }, page, pageSize);
    const expenses = await this.prisma.expense.findMany(query);
    return expenses;
  }

  async individualSpending(
    { userId, from, to }: { userId: string; from?: Date; to?: Date },
    page = 1,
    pageSize = 50,
  ) {
    const where: any = { createdById: userId };
    if (from || to) where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lt = to;
    return this.prisma.expense.findMany(
      this.paginate({ where: { ...where, status: { not: 'CANCELLED' } }, orderBy: { createdAt: 'desc' } }, page, pageSize),
    );
  }

  async categorySpending(
    { groupId, category, from, to }: { groupId?: string; category?: string; from?: Date; to?: Date },
    page = 1,
    pageSize = 50,
  ) {
    // assume Expense has category field in future; fallback to description matching
    const where: any = { status: { not: 'CANCELLED' } };
    if (groupId) where.groupId = groupId;
    if (category) where.description = { contains: category, mode: 'insensitive' };
    if (from || to) where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lt = to;

    return this.prisma.expense.findMany(
      this.paginate({ where: { ...where, status: { not: 'CANCELLED' } }, orderBy: { createdAt: 'desc' } }, page, pageSize),
    );
  }

  async expenseHistory({ groupId, userId, q, page = 1, pageSize = 50 }: { groupId?: string; userId?: string; q?: string; page?: number; pageSize?: number }) {
    const where: any = { status: { not: 'CANCELLED' } };
    if (groupId) where.groupId = groupId;
    if (userId) where.createdById = userId;
    if (q) where.description = { contains: q, mode: 'insensitive' };
    const query = this.paginate({ where, orderBy: { createdAt: 'desc' } }, page, pageSize);
    return this.prisma.expense.findMany(query);
  }
}
