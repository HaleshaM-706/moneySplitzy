import { NotFoundException } from '@nestjs/common';
import { GroupsController } from './groups.controller';

describe('GroupsController', () => {
  it('returns per-group totals, net balance, and latest group activity', async () => {
    const createdAt = new Date('2026-10-01T00:00:00.000Z');
    const newestActivity = new Date('2026-10-04T00:00:00.000Z');
    const prisma = {
      group: {
        findMany: jest.fn().mockResolvedValue([{
          id: 'group-1',
          name: 'Trip',
          currency: 'INR',
          createdAt,
          updatedAt: createdAt,
          _count: { members: 3 },
        }]),
      },
      expense: {
        groupBy: jest.fn().mockImplementation((query: { _sum?: unknown }) => Promise.resolve(
          query._sum
            ? [{ groupId: 'group-1', _sum: { totalMinor: 1200 } }]
            : [{ groupId: 'group-1', _max: { createdAt: new Date('2026-10-02T00:00:00.000Z') } }],
        )),
      },
      expensePayment: {
        findMany: jest.fn().mockResolvedValue([{ amountMinor: 1200, expense: { groupId: 'group-1' } }]),
      },
      expenseSplit: {
        findMany: jest.fn().mockResolvedValue([{ amountMinor: 200, expense: { groupId: 'group-1' } }]),
      },
      settlement: {
        findMany: jest.fn().mockResolvedValue([{
          groupId: 'group-1',
          fromUserId: 'user-1',
          toUserId: 'user-2',
          amountMinor: 100,
          currency: 'INR',
        }]),
        groupBy: jest.fn().mockResolvedValue([{
          groupId: 'group-1',
          _max: { createdAt: newestActivity },
        }]),
      },
      groupMember: {
        groupBy: jest.fn().mockResolvedValue([{
          groupId: 'group-1',
          _max: { joinedAt: new Date('2026-10-03T00:00:00.000Z') },
        }]),
      },
    };
    const controller = new GroupsController(prisma as any);

    const result = await controller.list({ user: { id: 'user-1' } });

    expect(prisma.group.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { members: { some: { userId: 'user-1' } } },
    }));
    expect(result).toEqual([expect.objectContaining({
      id: 'group-1',
      memberCount: 3,
      totalMinor: 1200,
      netMinor: 1100,
      recentActivity: 'Payment settled',
      lastActivityAt: newestActivity,
    })]);
  });

  it('does not return group activities to non-members', async () => {
    const prisma = {
      groupMember: { findUnique: jest.fn().mockResolvedValue(null) },
      group: { findUnique: jest.fn() },
    };
    const controller = new GroupsController(prisma as any);

    await expect(controller.activities({ user: { id: 'outsider' } }, 'private-group'))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.group.findUnique).not.toHaveBeenCalled();
  });
});
