import {
  Body,
  BadRequestException,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ExpenseStatus, Prisma, SplitType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  IsString,
  IsUUID,
  MaxLength,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../common/prisma.service';

class ExpenseAllocationDto {
  @IsUUID()
  userId: string;

  @IsInt()
  @Min(1)
  @Max(2147483647)
  amountMinor: number;
}

class CreateExpenseDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsInt()
  @Min(1)
  @Max(2147483647)
  totalMinor: number;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;

  @IsEnum(SplitType)
  splitType: SplitType;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExpenseAllocationDto)
  payments: ExpenseAllocationDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExpenseAllocationDto)
  splits: ExpenseAllocationDto[];
}

class CreateExpenseWithGroupDto extends CreateExpenseDto {
  @IsUUID()
  groupId: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private prisma: PrismaService) {}

  @Post('expenses')
  async createWithGroup(@Req() req: any, @Body() body: CreateExpenseWithGroupDto) {
    return this.create(req, body.groupId, body);
  }

  @Post('groups/:groupId/expenses')
  async create(
    @Req() req: any,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() body: CreateExpenseDto,
  ) {
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: req.user.id } },
      include: { group: { select: { currency: true } } },
    });
    if (!member) throw new NotFoundException('Group not found');
    if (body.currency && body.currency !== member.group.currency) {
      throw new BadRequestException('Expense currency must match the group currency');
    }

    this.assertAllocation(body.payments, body.totalMinor, 'payments');
    this.assertAllocation(body.splits, body.totalMinor, 'splits');
    this.assertUniqueUsers(body.payments, 'payments');
    this.assertUniqueUsers(body.splits, 'splits');

    const users = [...new Set([...body.payments, ...body.splits].map(row => row.userId))];
    const groupMembers = await this.prisma.groupMember.findMany({
      where: { groupId, userId: { in: users } },
      select: { userId: true },
    });
    if (groupMembers.length !== users.length) {
      throw new NotFoundException('All payment and split users must be group members');
    }

    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
    if (idempotencyKey && (idempotencyKey.trim().length === 0 || idempotencyKey.length > 200)) {
      throw new BadRequestException('Idempotency-Key must contain 1 to 200 characters');
    }
    if (idempotencyKey) {
      const existing = await this.prisma.idempotencyKey.findUnique({
        where: { key: idempotencyKey },
      });
      if (existing) throw new ConflictException('Duplicate request');
    }

    try {
      return await this.prisma.$transaction(async tx => {
        const expense = await tx.expense.create({
          data: {
            groupId,
            description: body.description,
            totalMinor: body.totalMinor,
            currency: body.currency ?? member.group.currency,
            splitType: body.splitType,
            createdById: req.user.id,
            payments: {
              create: body.payments.map(({ userId, amountMinor }) => ({
                amountMinor,
                user: { connect: { id: userId } },
              })),
            },
            splits: {
              create: body.splits.map(({ userId, amountMinor }) => ({
                amountMinor,
                user: { connect: { id: userId } },
              })),
            },
          },
          include: {
            payments: { select: { userId: true, amountMinor: true } },
            splits: { select: { userId: true, amountMinor: true } },
          },
        });
        if (idempotencyKey) {
          await tx.idempotencyKey.create({
            data: {
              key: idempotencyKey,
              endpoint: `POST:/groups/${groupId}/expenses`,
              userId: req.user.id,
            },
          });
        }
        await tx.auditLog.create({
          data: {
            actorUserId: req.user.id,
            entityType: 'Expense',
            entityId: expense.id,
            action: 'CREATE',
            metadata: { groupId, totalMinor: body.totalMinor, currency: expense.currency },
          },
        });
        return expense;
      });
    } catch (error) {
      if (
        idempotencyKey &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Duplicate request');
      }
      throw error;
    }
  }

  @Get('groups/:groupId/expenses')
  async list(@Req() req: any, @Param('groupId', ParseUUIDPipe) groupId: string) {
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: req.user.id } },
      select: { id: true },
    });
    if (!member) throw new NotFoundException('Group not found');
    return this.prisma.expense.findMany({
      where: { groupId, status: { not: ExpenseStatus.CANCELLED } },
      orderBy: { createdAt: 'desc' },
      include: {
        payments: { select: { userId: true, amountMinor: true } },
        splits: { select: { userId: true, amountMinor: true } },
      },
    });
  }

  @Get('groups/:groupId/expenses/:expenseId')
  async get(
    @Req() req: any,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('expenseId', ParseUUIDPipe) expenseId: string,
  ) {
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: req.user.id } },
      select: { id: true },
    });
    if (!member) throw new NotFoundException('Expense not found');
    const expense = await this.prisma.expense.findFirst({
      where: { id: expenseId, groupId },
      include: {
        payments: { select: { userId: true, amountMinor: true } },
        splits: { select: { userId: true, amountMinor: true } },
      },
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  private assertAllocation(
    allocations: ExpenseAllocationDto[],
    expected: number,
    name: string,
  ) {
    if (allocations.reduce((sum, row) => sum + row.amountMinor, 0) !== expected) {
      throw new BadRequestException(`${name} must sum to totalMinor`);
    }
  }

  private assertUniqueUsers(allocations: ExpenseAllocationDto[], name: string) {
    if (new Set(allocations.map(row => row.userId)).size !== allocations.length) {
      throw new BadRequestException(`${name} must contain each user only once`);
    }
  }
}
