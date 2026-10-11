import {
  Body,
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

    return groups.map(({ _count, ...group }) => ({ ...group, memberCount: _count.members }));
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
  async inviteMember(
    @Req() req: any,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() body: InviteGroupMemberDto,
  ) {
    return this.invite(req, groupId, body);
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
