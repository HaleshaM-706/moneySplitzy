import { ReportsService } from '../reports/reports.service';

const makePrismaMock = (overrides: any = {}) => ({
  $queryRawUnsafe: jest.fn().mockResolvedValue(overrides.monthly || []),
  expense: { findMany: jest.fn().mockResolvedValue(overrides.expenses || []) }
});

describe('ReportsService', () => {
  it('returns monthly spending rows', async () => {
    const prisma = makePrismaMock({ monthly: [{ month: '2026-01-01', total_minor: 1000 }] });
    const svc = new ReportsService(prisma as any);
    const rows = await svc.monthlySpending({ groupId: 'g1', year: 2026 }, 1, 10);
    expect(rows).toHaveLength(1);
    expect(prisma.$queryRawUnsafe).toHaveBeenCalled();
  });

  it('paginates group spending', async () => {
    const prisma = makePrismaMock({ expenses: [{ id: 'e1' }, { id: 'e2' }] });
    const svc = new ReportsService(prisma as any);
    const res = await svc.groupSpending({ groupId: 'g1', page: 1, pageSize: 2 });
    expect(res).toHaveLength(2);
    expect(prisma.expense.findMany).toHaveBeenCalled();
  });
});
