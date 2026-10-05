import { NotificationsService } from '../notifications/notifications.service';

jest.mock('firebase-admin', () => ({
  apps: [{}],
  initializeApp: jest.fn(),
  messaging: jest.fn(() => ({ send: jest.fn().mockResolvedValue('ok') })),
}));

const makePrismaMock = () => ({
  notification: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 'n1', data: {} }), update: jest.fn().mockResolvedValue({ id: 'n1' }) },
  user: { findUnique: jest.fn().mockResolvedValue({ id: 'u1' }) },
  auditLog: { create: jest.fn().mockResolvedValue({}) }
});

describe('NotificationsService', () => {
  it('creates a DB record and attempts to send', async () => {
    const prisma = makePrismaMock();
    const svc = new NotificationsService(prisma as any);
    const rec = await svc.notifyUser('u1', 'T', 'B', { a: 1 }, 'd1');
    expect(rec).toHaveProperty('id');
    expect(prisma.notification.create).toHaveBeenCalled();
  });
});
