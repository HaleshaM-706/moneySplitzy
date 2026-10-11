import {
  Body,
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsInt, IsOptional, IsString, IsUUID, Matches, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../common/prisma.service';
import { DebtSimplificationService } from '../debt-simplification/debt-simplification.service';
import { SettlementsService } from './settlements.service';

class CreateSettlementDto {
  @IsUUID()
  groupId: string;

  @IsUUID()
  fromUserId: string;

  @IsUUID()
  toUserId: string;

  @IsInt()
  @Min(1)
  @Max(2147483647)
  amountMinor: number;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class SettlementsController {
  constructor(
    private prisma: PrismaService,
    private settlements: SettlementsService,
    private debtSimplification: DebtSimplificationService,
  ) {}

  @Post('settlements')
  async create(@Req() req: any, @Body() body: CreateSettlementDto) {
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: body.groupId, userId: req.user.id } },
      include: { group: { select: { currency: true } } },
    });
    if (!membership) throw new NotFoundException('Group not found');
    if (body.currency && body.currency !== membership.group.currency) {
      throw new BadRequestException('Settlement currency must match the group currency');
    }
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
    if (idempotencyKey && (idempotencyKey.trim().length === 0 || idempotencyKey.length > 200)) {
      throw new BadRequestException('Idempotency-Key must contain 1 to 200 characters');
    }
    return this.settlements.createSettlement({
      ...body,
      currency: body.currency ?? membership.group.currency,
      actorUserId: req.user.id,
      idempotencyKey,
    });
  }

  @Get('groups/:groupId/settlements')
  async listForGroup(
    @Req() req: any,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ) {
    await this.requireMembership(groupId, req.user.id);
    return this.settlements.getSettlementsForGroup(groupId);
  }

  @Get('settlements/:settlementId')
  async get(
    @Req() req: any,
    @Param('settlementId', ParseUUIDPipe) settlementId: string,
  ) {
    const settlement = await this.settlements.getSettlement(settlementId);
    if (!settlement) throw new NotFoundException('Settlement not found');
    await this.requireMembership(settlement.groupId, req.user.id);
    return settlement;
  }

  @Get('groups/:groupId/debts/simplified')
  async simplify(
    @Req() req: any,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ) {
    await this.requireMembership(groupId, req.user.id);
    return this.debtSimplification.simplifyGroupDebts(groupId);
  }

  private async requireMembership(groupId: string, userId: string) {
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
      select: { id: true },
    });
    if (!membership) throw new NotFoundException('Group not found');
  }
}
