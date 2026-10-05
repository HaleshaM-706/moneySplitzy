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
        // initialize with application default credentials when available
        admin.initializeApp();
      }
      this.appInitialized = true;
    } catch (e) {
      logger.warn('Firebase Admin init failed; notifications disabled in this environment');
    }
  }

  // send notification to a user (safeguarded to avoid duplicates)
  async notifyUser(userId: string, title: string, body: string, data?: any, dedupeKey?: string) {
    const notificationData =
      data && typeof data === 'object' && !Array.isArray(data) ? data : {};

    // prevent duplicate notifications by dedupe key
    if (dedupeKey) {
      const existing = await this.prisma.notification.findFirst({ where: { data: { path: ['dedupe'], equals: dedupeKey } } });
      if (existing) return existing;
    }

    // create DB record first
    const record = await this.prisma.notification.create({ data: { userId, title, body, data: { ...notificationData, dedupe: dedupeKey } } });

    if (!this.appInitialized) return record;

    // look up user's FCM tokens (assuming stored in RefreshToken or separate table; using Notification.user relation for demo)
    // TODO: implement device token storage; here we attempt to load a user's profile field `fcmTokens` if exists
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return record;

    try {
      // For demo: send a simple notification to topic of user
      const message: admin.messaging.Message = {
        topic: `user-${userId}`,
        notification: { title, body },
        data: data && typeof data === 'object' ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : {}
      };

      // retry loop with limited attempts
      const maxAttempts = 3;
      let attempt = 0;
      let sent = false;
      while (attempt < maxAttempts && !sent) {
        try {
          attempt++;
          await admin.messaging().send(message);
          sent = true;
        } catch (err) {
          logger.warn(`FCM send attempt ${attempt} failed`);
          if (attempt >= maxAttempts) logger.error('FCM send failed after retries', err as any);
          // simple backoff
          await new Promise(r => setTimeout(r, 100 * attempt));
        }
      }

      // mark record as sent in DB (store sent flag in data JSON)
      const storedData =
        record.data && typeof record.data === 'object' && !Array.isArray(record.data)
          ? record.data
          : {};
      await this.prisma.notification.update({ where: { id: record.id }, data: { data: { ...storedData, sent: sent ? new Date().toISOString() : null } } });

      // audit
      await this.prisma.auditLog.create({ data: { actorUserId: userId, entityType: 'Notification', entityId: record.id, action: 'SEND', metadata: { title, body, sent } } });
    } catch (e) {
      logger.error('FCM send failed', e as any);
    }

    return record;
  }

  async notifyGroupMembers(groupId: string, title: string, body: string, data?: any) {
    const members = await this.prisma.groupMember.findMany({ where: { groupId }, select: { userId: true } });
    for (const m of members) {
      await this.notifyUser(m.userId, title, body, data, `${groupId}-${title}-${body}`);
    }
  }
}
