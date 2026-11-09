import { ExpensesController } from '../groups/expenses.controller';
import { SettlementsController } from '../settlements/settlements.controller';

describe('group activity push notifications', () => {
  it('notifies other group members after creating an expense', async () => {
    const expense = { id: 'expense-1', currency: 'INR' };
    const prisma = {
      groupMember: {
        findUnique: jest.fn().mockResolvedValue({
          group: { currency: 'INR', name: 'Weekend trip' },
        }),
        findMany: jest.fn().mockResolvedValue([
          { userId: 'payer-1' },
          { userId: 'member-2' },
        ]),
      },
      $transaction: jest.fn().mockImplementation(async callback => callback({
        expense: { create: jest.fn().mockResolvedValue(expense) },
        auditLog: { create: jest.fn().mockResolvedValue({}) },
      })),
    };
    const notifications = { notifyGroupMembers: jest.fn().mockResolvedValue(undefined) };
    const controller = new ExpensesController(prisma as any, notifications as any);

    await controller.create(
      { user: { id: 'payer-1' }, headers: {} },
      'group-1',
      {
        totalMinor: 100,
        splitType: 'EQUAL' as any,
        payments: [{ userId: 'payer-1', amountMinor: 100 }],
        splits: [
          { userId: 'payer-1', amountMinor: 50 },
          { userId: 'member-2', amountMinor: 50 },
        ],
      },
    );

    expect(notifications.notifyGroupMembers).toHaveBeenCalledWith(
      'group-1',
      'New group expense',
      'A new expense was added to Weekend trip.',
      { type: 'expense', groupId: 'group-1', expenseId: 'expense-1' },
      'expense-expense-1',
      'payer-1',
    );
  });

  it('notifies other group members after recording a settlement', async () => {
    const settlement = { id: 'settlement-1' };
    const prisma = {
      groupMember: {
        findUnique: jest.fn().mockResolvedValue({
          role: 'MEMBER',
          group: { currency: 'INR' },
        }),
      },
    };
    const settlements = { createSettlement: jest.fn().mockResolvedValue(settlement) };
    const debtSimplification = {};
    const notifications = { notifyGroupMembers: jest.fn().mockResolvedValue(undefined) };
    const controller = new SettlementsController(
      prisma as any,
      settlements as any,
      debtSimplification as any,
      notifications as any,
    );

    await controller.create(
      { user: { id: 'payer-1' }, headers: {} },
      {
        groupId: 'group-1',
        fromUserId: 'payer-1',
        toUserId: 'payee-1',
        amountMinor: 100,
      },
    );

    expect(notifications.notifyGroupMembers).toHaveBeenCalledWith(
      'group-1',
      'Group settlement recorded',
      'A payment was recorded toward settling group expenses.',
      { type: 'settlement', groupId: 'group-1', settlementId: 'settlement-1' },
      'settlement-settlement-1',
      'payer-1',
    );
  });
});
