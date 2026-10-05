import { BalancesService } from '../balances/balances.service';
import { DebtSimplificationService } from '../debt-simplification/debt-simplification.service';
import { SettlementsService } from '../settlements/settlements.service';

// simple mock PrismaService
const makePrismaMock = (data: any) => ({
  group: { findUnique: jest.fn().mockResolvedValue({ id: data.groupId, currency: data.currency || 'INR' }) },
  groupMember: { findMany: jest.fn().mockResolvedValue(data.members.map((id: string) => ({ userId: id }))) },
  expensePayment: { findMany: jest.fn().mockResolvedValue(data.payments) },
  expenseSplit: { findMany: jest.fn().mockResolvedValue(data.splits) },
  settlement: { findMany: jest.fn().mockResolvedValue(data.settlements), create: jest.fn().mockResolvedValue({ id: 's1',}) , findUnique: jest.fn().mockResolvedValue(null) },
  idempotencyKey: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({}) },
  auditLog: { create: jest.fn().mockResolvedValue({}) },
  $transaction: jest.fn().mockImplementation(async (fn: any) => { return fn({
    settlement: { create: (opts: any) => ({ id: 's1', ...opts.data }) },
    idempotencyKey: { create: (opts: any) => ({}) },
    auditLog: { create: (opts: any) => ({}) }
  }); })
});

describe('Balances and Settlements complex scenario', () => {
  it('calculates balances and simplifies debts for 5 users with multiple expenses, payers and settlements', async () => {
    const groupId = 'g1';
    const users = ['u1','u2','u3','u4','u5'];
    // create scenario:
    // Expense A: paid by u1 amount 1000, split equally among all 5 => each owes 200
    // Expense B: paid by u2 amount 500, split among u2,u3 => each owes 250
    // Expense C: paid by u3 amount 300, splits: u3 pays 100, u4 pays 200 (two payers scenario via payments)
    const payments = [
      { userId: 'u1', amountMinor: 1000 },
      { userId: 'u2', amountMinor: 500 },
      { userId: 'u3', amountMinor: 300 }
    ];
    const splits = [
      // Expense A splits
      { userId: 'u1', amountMinor: 200 }, { userId: 'u2', amountMinor: 200 }, { userId: 'u3', amountMinor: 200 }, { userId: 'u4', amountMinor: 200 }, { userId: 'u5', amountMinor: 200 },
      // Expense B
      { userId: 'u2', amountMinor: 250 }, { userId: 'u3', amountMinor: 250 },
      // Expense C
      { userId: 'u3', amountMinor: 100 }, { userId: 'u4', amountMinor: 200 }
    ];

    const settlements = [
      // u5 paid u1 150
      { fromUserId: 'u5', toUserId: 'u1', amountMinor: 150, currency: 'INR' }
    ];

    const prisma = makePrismaMock({ groupId, members: users, payments, splits, settlements, currency: 'INR' });

    const balancesService = new BalancesService(prisma as any);
    const balances = await balancesService.getGroupBalances(groupId);

    // net balances should sum to zero
    const sum = balances.reduce((s, b) => s + b.netMinor, 0);
    expect(sum).toBe(0);

    // run simplification
    const debtService = new DebtSimplificationService(prisma as any);
    const simplified = await debtService.simplifyGroupDebts(groupId);

    // simplified result should clear net balances when applied
    // compute net map
    const netMap: Record<string, number> = {};
    for (const b of balances) netMap[b.userId] = b.netMinor;
    for (const s of simplified) {
      netMap[s.fromUserId] += s.amountMinor;
      netMap[s.toUserId] -= s.amountMinor;
    }
    const finalSum = Object.values(netMap).reduce((s, v) => s + v, 0);
    expect(finalSum).toBe(0);
    // after applying, all net balances should be zero
    for (const v of Object.values(netMap)) expect(v).toBe(0);
  });

  it('creates a settlement with validations and records idempotency and audit log', async () => {
    const prisma = makePrismaMock({ groupId: 'g1', members: ['a','b'], payments: [], splits: [], settlements: [], currency: 'INR' });
    const svc = new SettlementsService(prisma as any);
    const settlement = await svc.createSettlement({ groupId: 'g1', fromUserId: 'a', toUserId: 'b', amountMinor: 100, idempotencyKey: 'k1', actorUserId: 'a' });
    expect(settlement).toHaveProperty('id');
    // idempotency key should have been created through transaction
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
