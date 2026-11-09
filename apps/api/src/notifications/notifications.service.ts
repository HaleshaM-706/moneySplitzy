import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as admin from 'firebase-admin';

const logger = new Logger('NotificationsService');

@Injectable()
export class NotificationsService {
  private appInitialized = false;

  constructor(private prisma: PrismaService) {
    try {
      if (!admin.apps.length) {
        admin.initializeApp();
      }
      this.appInitialized = true;
    } catch (error) {
      logger.warn(`Firebase Admin initialization failed; push notifications are disabled: ${String(error)}`);
    }
  }

  async notifyUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    dedupeKey?: string,
  ) {
    const notificationData =
      data && typeof data === 'object' && !Array.isArray(data) ? data : {};

    if (dedupeKey) {
      const existing = await this.prisma.notification.findFirst({
        where: {
          userId,
          data: { path: ['dedupe'], equals: dedupeKey },
        },
      });
      if (existing) return existing;
    }

    const record = await this.prisma.notification.create({
      data: {
        userId,
        title,
        body,
        data: { ...notificationData, ...(dedupeKey ? { dedupe: dedupeKey } : {}) },
      },
    });

    if (!this.appInitialized) return record;

    try {
      const devices = await this.prisma.pushDeviceToken.findMany({
        where: { userId },
        select: { token: true },
      });
      if (devices.length === 0) return record;

      const response = await admin.messaging().sendEachForMulticast({
        tokens: devices.map(device => device.token),
        notification: { title, body },
        data: notificationData,
      });

      const invalidTokens = response.responses.flatMap((result, index) =>
        !result.success &&
        (result.error?.code === 'messaging/invalid-registration-token' ||
          result.error?.code === 'messaging/registration-token-not-registered')
          ? [devices[index].token]
          : [],
      );
      if (invalidTokens.length > 0) {
        await this.prisma.pushDeviceToken.deleteMany({
          where: { token: { in: invalidTokens } },
        });
      }

      const storedData =
        record.data && typeof record.data === 'object' && !Array.isArray(record.data)
          ? record.data
          : {};
      await this.prisma.notification.update({
        where: { id: record.id },
        data: {
          data: {
            ...storedData,
            pushSent: response.successCount,
            pushFailed: response.failureCount,
          },
        },
      });

      if (response.failureCount > 0) {
        logger.warn(`Push delivery failed for ${response.failureCount} device(s) for notification ${record.id}.`);
      }
    } catch (error) {
      logger.error(`Push delivery failed for notification ${record.id}.`, error);
    }

    return record;
  }

  async notifyGroupMembers(
    groupId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    dedupeKey?: string,
    excludeUserId?: string,
  ) {
    let members;
    try {
      members = await this.prisma.groupMember.findMany({
        where: { groupId },
        select: { userId: true },
      });
    } catch (error) {
      logger.error(`Could not find members to notify for group ${groupId}.`, error);
      return;
    }
    const results = await Promise.allSettled(
      members
        .filter(member => member.userId !== excludeUserId)
        .map(member =>
          this.notifyUser(
            member.userId,
            title,
            body,
            data,
            dedupeKey ? `${dedupeKey}-${member.userId}` : undefined,
          ),
        ),
    );
    for (const result of results) {
      if (result.status === 'rejected') {
        logger.error(`Could not create a group notification for group ${groupId}.`, result.reason);
      }
    }
  }
}
