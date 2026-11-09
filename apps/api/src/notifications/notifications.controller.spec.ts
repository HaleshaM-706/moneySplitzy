import { NotificationsController } from './notifications.controller';

describe('NotificationsController', () => {
  it('registers a push device to the authenticated user', async () => {
    const prisma = {
      pushDeviceToken: {
        upsert: jest.fn().mockResolvedValue({ id: 'device-1' }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const controller = new NotificationsController(prisma as any);

    await expect(controller.registerDevice(
      { user: { id: 'user-1' } },
      { token: 'device-token', platform: 'ios' },
    )).resolves.toEqual({ registered: true, id: 'device-1' });
    expect(prisma.pushDeviceToken.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { token: 'device-token' },
      create: expect.objectContaining({ userId: 'user-1', platform: 'ios' }),
      update: expect.objectContaining({ userId: 'user-1', platform: 'ios' }),
    }));
  });

  it('only unregisters the authenticated user’s device token', async () => {
    const prisma = {
      pushDeviceToken: {
        upsert: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const controller = new NotificationsController(prisma as any);

    await expect(controller.unregisterDevice(
      { user: { id: 'user-1' } },
      { token: 'device-token', platform: 'android' },
    )).resolves.toEqual({ unregistered: true });
    expect(prisma.pushDeviceToken.deleteMany).toHaveBeenCalledWith({
      where: { token: 'device-token', userId: 'user-1' },
    });
  });
});
