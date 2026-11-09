import { NotificationsService } from '../notifications/notifications.service';
import * as admin from 'firebase-admin';

jest.mock('firebase-admin', () => ({
  apps: [{}],
  initializeApp: jest.fn(),
  messaging: jest.fn(() => ({
    sendEachForMulticast: jest.fn().mockResolvedValue({
      successCount: 0,
      failureCount: 0,
      responses: [],
    }),
  })),
}));

const makePrismaMock = () => ({
  notification: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 'n1', data: {} }), update: jest.fn().mockResolvedValue({ id: 'n1' }) },
  pushDeviceToken: {
    findMany: jest.fn().mockResolvedValue([]),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
});

describe('NotificationsService', () => {
  it('creates a DB record and attempts to send', async () => {
    const prisma = makePrismaMock();
    const svc = new NotificationsService(prisma as any);
    const rec = await svc.notifyUser('u1', 'T', 'B', { a: '1' }, 'd1');
    expect(rec).toHaveProperty('id');
    expect(prisma.notification.create).toHaveBeenCalled();
    expect(prisma.pushDeviceToken.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      select: { token: true },
    });
  });

  it('sends push notifications to the registered devices for that user', async () => {
    const prisma = makePrismaMock();
    prisma.pushDeviceToken.findMany.mockResolvedValue([{ token: 'device-token' }]);
    const sendEachForMulticast = jest.fn().mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      responses: [{ success: true }],
    });
    (admin.messaging as jest.Mock).mockReturnValue({ sendEachForMulticast });
    const svc = new NotificationsService(prisma as any);

    await svc.notifyUser('u1', 'Expense added', 'An expense was added.', { groupId: 'g1' });

    expect(sendEachForMulticast).toHaveBeenCalledWith({
      tokens: ['device-token'],
      notification: { title: 'Expense added', body: 'An expense was added.' },
      data: { groupId: 'g1' },
    });
  });
});
