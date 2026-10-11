import {
  Controller,
  BadRequestException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../common/prisma.service';
import { ReportsService } from './reports.service';

function assertDateRange(from?: string, to?: string) {
  if (from && to && new Date(from) >= new Date(to)) {
    throw new BadRequestException('from must be earlier than to');
  }
}

class ReportQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize = 50;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Get('monthly-spending')
  async monthlySpending(@Req() req: any, @Query() query: ReportQueryDto) {
    return this.reports.monthlySpending(
      { groupId: undefined, userId: req.user.id, year: query.year },
      query.page,
      query.pageSize,
    );
  }

  @Get('me/spending')
  async individualSpending(@Req() req: any, @Query() query: ReportQueryDto) {
    assertDateRange(query.from, query.to);
    return this.reports.individualSpending({
      userId: req.user.id,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    }, query.page, query.pageSize);
  }

  @Get('history')
  async expenseHistory(@Req() req: any, @Query() query: ReportQueryDto) {
    return this.reports.expenseHistory({
      userId: req.user.id,
      q: query.q,
      page: query.page,
      pageSize: query.pageSize,
    });
  }
}

@Controller('groups/:groupId/reports')
@UseGuards(JwtAuthGuard)
export class GroupReportsController {
  constructor(
    private prisma: PrismaService,
    private reports: ReportsService,
  ) {}

  @Get('monthly-spending')
  async monthlySpending(
    @Req() req: any,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query() query: ReportQueryDto,
  ) {
    await this.requireMembership(groupId, req.user.id);
    return this.reports.monthlySpending(
      { groupId, year: query.year },
      query.page,
      query.pageSize,
    );
  }

  @Get('spending')
  async groupSpending(
    @Req() req: any,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query() query: ReportQueryDto,
  ) {
    assertDateRange(query.from, query.to);
    await this.requireMembership(groupId, req.user.id);
    return this.reports.groupSpending({
      groupId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Get('categories')
  async categorySpending(
    @Req() req: any,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query() query: ReportQueryDto,
  ) {
    assertDateRange(query.from, query.to);
    await this.requireMembership(groupId, req.user.id);
    return this.reports.categorySpending({
      groupId,
      category: query.category,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    }, query.page, query.pageSize);
  }

  @Get('history')
  async expenseHistory(
    @Req() req: any,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query() query: ReportQueryDto,
  ) {
    await this.requireMembership(groupId, req.user.id);
    return this.reports.expenseHistory({
      groupId,
      q: query.q,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  private async requireMembership(groupId: string, userId: string) {
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
      select: { id: true },
    });
    if (!membership) throw new NotFoundException('Group not found');
  }
}
