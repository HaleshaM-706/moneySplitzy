import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
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
    const controller = new GroupsController(prisma as any, {} as any);

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
    const controller = new GroupsController(prisma as any, {} as any);

    await expect(controller.activities({ user: { id: 'outsider' } }, 'private-group'))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.group.findUnique).not.toHaveBeenCalled();
  });

  it('sends the invitation email and returns the invite code', async () => {
    const expiresAt = new Date('2026-11-12T00:00:00.000Z');
    const createdAt = new Date('2026-11-05T00:00:00.000Z');
    const prisma = {
      groupMember: { findUnique: jest.fn().mockResolvedValue({ role: 'ADMIN' }) },
      groupInvitation: {
        create: jest.fn().mockResolvedValue({
          id: 'invitation-1',
          groupId: 'group-1',
          email: 'person@example.com',
          token: 'invite-code',
          expiresAt,
          createdAt,
          group: { name: 'Trip' },
        }),
      },
    };
    const email = { sendGroupInvitationEmail: jest.fn().mockResolvedValue(undefined) };
    const controller = new GroupsController(prisma as any, email as any);

    const result = await controller.invite(
      { user: { id: 'admin-1' } },
      'group-1',
      { email: ' Person@Example.com ' },
    );

    expect(email.sendGroupInvitationEmail).toHaveBeenCalledWith(
      'person@example.com',
      'Trip',
      'invite-code',
      prisma.groupInvitation.create.mock.calls[0][0].data.expiresAt,
    );
    expect(result).toEqual({
      id: 'invitation-1',
      groupId: 'group-1',
      email: 'person@example.com',
      token: 'invite-code',
      expiresAt,
      createdAt,
      emailSent: true,
    });
  });

  it('keeps the invitation code available when email delivery is unavailable', async () => {
    const prisma = {
      groupMember: { findUnique: jest.fn().mockResolvedValue({ role: 'ADMIN' }) },
      groupInvitation: {
        create: jest.fn().mockResolvedValue({
          id: 'invitation-1',
          groupId: 'group-1',
          email: 'person@example.com',
          token: 'invite-code',
          expiresAt: new Date('2026-11-12T00:00:00.000Z'),
          createdAt: new Date('2026-11-05T00:00:00.000Z'),
          group: { name: 'Trip' },
        }),
      },
    };
    const email = {
      sendGroupInvitationEmail: jest.fn().mockRejectedValue(
        new ServiceUnavailableException('Email is not configured'),
      ),
    };
    const controller = new GroupsController(prisma as any, email as any);

    const result = await controller.invite(
      { user: { id: 'admin-1' } },
      'group-1',
      { email: 'person@example.com' },
    );

    expect(result).toEqual(expect.objectContaining({
      token: 'invite-code',
      emailSent: false,
    }));
  });
});
