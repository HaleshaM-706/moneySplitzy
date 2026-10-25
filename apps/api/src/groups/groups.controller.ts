import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../common/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

class CreateGroupDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  icon?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;
}

class InviteGroupMemberDto {
  @IsEmail()
  email: string;
}

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async create(@Req() req: any, @Body() body: CreateGroupDto) {
    return this.prisma.$transaction(async tx => {
      const group = await tx.group.create({
        data: {
          name: body.name,
          description: body.description,
          category: body.category ?? 'OTHER',
          icon: body.icon ?? '👥',
          currency: body.currency ?? 'INR',
          createdById: req.user.id,
        },
      });
      await tx.groupMember.create({
        data: { groupId: group.id, userId: req.user.id, role: 'ADMIN' },
      });
      return { ...group, memberCount: 1 };
    });
  }

  @Get()
  async list(@Req() req: any) {
    const groups = await this.prisma.group.findMany({
      where: { members: { some: { userId: req.user.id } } },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { members: true } } },
    });

    if (groups.length === 0) return [];

    const groupIds = groups.map(group => group.id);
    const [expenseTotals, payments, splits, settlements, latestExpenses, latestSettlements, latestMembers] = await Promise.all([
      this.prisma.expense.groupBy({
        by: ['groupId'],
        where: { groupId: { in: groupIds }, status: { not: 'CANCELLED' } },
        _sum: { totalMinor: true },
      }),
      this.prisma.expensePayment.findMany({
        where: { userId: req.user.id, expense: { groupId: { in: groupIds }, status: { not: 'CANCELLED' } } },
        select: { amountMinor: true, expense: { select: { groupId: true } } },
      }),
      this.prisma.expenseSplit.findMany({
        where: { userId: req.user.id, expense: { groupId: { in: groupIds }, status: { not: 'CANCELLED' } } },
        select: { amountMinor: true, expense: { select: { groupId: true } } },
      }),
      this.prisma.settlement.findMany({
        where: { groupId: { in: groupIds }, status: 'COMPLETED' },
        select: { groupId: true, fromUserId: true, toUserId: true, amountMinor: true, currency: true },
      }),
      this.prisma.expense.groupBy({
        by: ['groupId'],
        where: { groupId: { in: groupIds }, status: { not: 'CANCELLED' } },
        _max: { createdAt: true },
      }),
      this.prisma.settlement.groupBy({
        by: ['groupId'],
        where: { groupId: { in: groupIds }, status: 'COMPLETED' },
        _max: { createdAt: true },
      }),
      this.prisma.groupMember.groupBy({
        by: ['groupId'],
        where: { groupId: { in: groupIds } },
        _max: { joinedAt: true },
      }),
    ]);

    const totalsByGroup = new Map(expenseTotals.map(row => [row.groupId, row._sum.totalMinor ?? 0]));
    const netByGroup = new Map<string, number>();
    for (const payment of payments) {
      const id = payment.expense.groupId;
      netByGroup.set(id, (netByGroup.get(id) ?? 0) + payment.amountMinor);
    }
    for (const split of splits) {
      const id = split.expense.groupId;
      netByGroup.set(id, (netByGroup.get(id) ?? 0) - split.amountMinor);
    }
    for (const settlement of settlements) {
      const group = groups.find(item => item.id === settlement.groupId);
      if (!group || group.currency !== settlement.currency) continue;
      const net = netByGroup.get(settlement.groupId) ?? 0;
      netByGroup.set(settlement.groupId, net + (settlement.fromUserId === req.user.id ? settlement.amountMinor : 0)
        - (settlement.toUserId === req.user.id ? settlement.amountMinor : 0));
    }

    const lastActivityByGroup = new Map<string, { at: Date; label: string }>();
    const recordActivity = (groupId: string, at: Date | null, label: string) => {
      if (!at) return;
      const previous = lastActivityByGroup.get(groupId);
      if (!previous || at > previous.at) lastActivityByGroup.set(groupId, { at, label });
    };
    for (const group of groups) recordActivity(group.id, group.createdAt, 'Group created');
    for (const row of latestExpenses) recordActivity(row.groupId, row._max.createdAt, 'Expense added');
    for (const row of latestSettlements) recordActivity(row.groupId, row._max.createdAt, 'Payment settled');
    for (const row of latestMembers) recordActivity(row.groupId, row._max.joinedAt, 'Member joined');

    return groups.map(({ _count, ...group }) => ({
      ...group,
      memberCount: _count.members,
      totalMinor: totalsByGroup.get(group.id) ?? 0,
      netMinor: netByGroup.get(group.id) ?? 0,
      recentActivity: lastActivityByGroup.get(group.id)?.label ?? 'Group created',
      lastActivityAt: lastActivityByGroup.get(group.id)?.at ?? group.createdAt,
    }));
  }

  @Get(':groupId')
  async get(@Req() req: any, @Param('groupId', ParseUUIDPipe) groupId: string) {
    await this.requireMembership(groupId, req.user.id);
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        _count: { select: { members: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
    if (!group) throw new NotFoundException('Group not found');
    const { _count, ...result } = group;
    return { ...result, memberCount: _count.members };
  }

  @Get(':groupId/activities')
  async activities(@Req() req: any, @Param('groupId', ParseUUIDPipe) groupId: string) {
    await this.requireMembership(groupId, req.user.id);
    const [group, expenses, settlements, members] = await Promise.all([
      this.prisma.group.findUnique({ where: { id: groupId }, select: { currency: true } }),
      this.prisma.expense.findMany({
        where: { groupId, status: { not: 'CANCELLED' } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          description: true,
          totalMinor: true,
          currency: true,
          createdAt: true,
          createdById: true,
          createdBy: { select: { name: true } },
        },
      }),
      this.prisma.settlement.findMany({
        where: { groupId, status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          amountMinor: true,
          currency: true,
          createdAt: true,
          fromUserId: true,
          fromUser: { select: { name: true } },
          toUser: { select: { name: true } },
        },
      }),
      this.prisma.groupMember.findMany({
        where: { groupId },
        orderBy: { joinedAt: 'desc' },
        take: 50,
        select: {
          id: true,
          userId: true,
          joinedAt: true,
          user: { select: { name: true } },
        },
      }),
    ]);
    if (!group) throw new NotFoundException('Group not found');

    return [
      ...expenses.map(expense => ({
        id: expense.id,
        type: 'EXPENSE' as const,
        title: expense.description || 'Expense added',
        action: 'added an expense',
        amountMinor: expense.totalMinor,
        actorId: expense.createdById,
        actor: expense.createdBy.name || 'A group member',
        createdAt: expense.createdAt,
        currency: expense.currency,
      })),
      ...settlements.map(settlement => ({
        id: settlement.id,
        type: 'SETTLEMENT' as const,
        title: `${settlement.fromUser.name || 'A member'} paid ${settlement.toUser.name || 'a member'}`,
        action: 'settled up',
        amountMinor: settlement.amountMinor,
        actorId: settlement.fromUserId,
        actor: settlement.fromUser.name || 'A group member',
        createdAt: settlement.createdAt,
        currency: settlement.currency,
      })),
      ...members.map(member => ({
        id: member.id,
        type: 'MEMBER' as const,
        title: `${member.user.name || 'A member'} joined the group`,
        action: 'joined the group',
        amountMinor: 0,
        actorId: member.userId,
        actor: member.user.name || 'A group member',
        createdAt: member.joinedAt,
        currency: group.currency,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 50);
  }

  @Post(':groupId/invitations')
  async invite(
    @Req() req: any,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() body: InviteGroupMemberDto,
  ) {
    const membership = await this.requireMembership(groupId, req.user.id);
    if (membership.role !== 'ADMIN') {
      throw new ForbiddenException('Only group admins can invite members');
    }

    const token = randomUUID();
    return this.prisma.groupInvitation.create({
      data: {
        groupId,
        email: body.email.toLowerCase(),
        invitedBy: req.user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      select: { id: true, groupId: true, email: true, token: true, expiresAt: true, createdAt: true },
    });
  }

  @Post(':groupId/members')
  async addExistingMember(
    @Req() req: any,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() body: InviteGroupMemberDto,
  ) {
    const membership = await this.requireMembership(groupId, req.user.id);
    if (membership.role !== 'ADMIN') {
      throw new ForbiddenException('Only group admins can add members');
    }

    const email = body.email.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('No existing user found with this email. Create an invitation instead.');
    }

    const existingMembership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: user.id } },
      select: { id: true },
    });
    if (existingMembership) {
      throw new ConflictException('This user is already a member of the group');
    }

    await this.prisma.groupMember.upsert({
      where: { groupId_userId: { groupId, userId: user.id } },
      create: { groupId, userId: user.id },
      update: {},
    });
    return { groupId, userId: user.id, added: true };
  }

  @Post('invitations/:token/accept')
  async acceptInvitation(
    @Req() req: any,
    @Param('token', ParseUUIDPipe) token: string,
  ) {
    const invitation = await this.prisma.groupInvitation.findUnique({ where: { token } });
    if (
      !invitation ||
      invitation.deletedAt ||
      (invitation.expiresAt && invitation.expiresAt <= new Date()) ||
      invitation.acceptedBy
    ) {
      throw new NotFoundException('Invitation is invalid or expired');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: { email: true },
    });
    if (!user || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenException('Invitation email does not match the authenticated user');
    }

    return this.prisma.$transaction(async tx => {
      await tx.groupMember.upsert({
        where: { groupId_userId: { groupId: invitation.groupId, userId: req.user.id } },
        create: { groupId: invitation.groupId, userId: req.user.id },
        update: {},
      });
      await tx.groupInvitation.update({
        where: { id: invitation.id },
        data: { acceptedBy: req.user.id },
      });
      return { groupId: invitation.groupId, joined: true };
    });
  }

  private async requireMembership(groupId: string, userId: string) {
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership) throw new NotFoundException('Group not found');
    return membership;
  }
}
