import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SettlementsService {
  constructor(private prisma: PrismaService) {}

  async createSettlement(options: { groupId: string; fromUserId: string; toUserId: string; amountMinor: number; currency?: string; idempotencyKey?: string; actorUserId?: string }) {
    const { groupId, fromUserId, toUserId, amountMinor, currency = 'INR', idempotencyKey, actorUserId } = options;

    if (fromUserId === toUserId) throw new BadRequestException('Cannot settle to self');
    if (amountMinor <= 0) throw new BadRequestException('Amount must be positive');

    // verify users belong to group
    const members = await this.prisma.groupMember.findMany({ where: { groupId, userId: { in: [fromUserId, toUserId] } }, select: { userId: true } });
    if (members.length !== 2) throw new BadRequestException('Both users must be group members');

    // check idempotency
    if (idempotencyKey) {
      const existing = await this.prisma.idempotencyKey.findUnique({ where: { key: idempotencyKey } });
      if (existing) throw new ConflictException('Duplicate request');
    }

    // use transaction to create settlement and record idempotency and audit
    const result = await this.prisma.$transaction(async (tx) => {
      const settlement = await tx.settlement.create({ data: { groupId, fromUserId, toUserId, amountMinor, currency, status: 'COMPLETED' } });

      if (idempotencyKey) {
        await tx.idempotencyKey.create({ data: { key: idempotencyKey, endpoint: 'POST:/settlements', userId: actorUserId ?? fromUserId } });
      }

      await tx.auditLog.create({ data: { actorUserId: actorUserId ?? fromUserId, entityType: 'Settlement', entityId: settlement.id, action: 'CREATE', metadata: { amountMinor, currency, fromUserId, toUserId, groupId } } });

      return settlement;
    });

    return result;
  }

  async getSettlementsForGroup(groupId: string) {
    return this.prisma.settlement.findMany({ where: { groupId }, orderBy: { createdAt: 'desc' } });
  }

  async getSettlement(id: string) {
    return this.prisma.settlement.findUnique({ where: { id } });
  }
}
