import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../common/prisma.service';
import { BalancesService } from './balances.service';

@Controller('groups/:groupId/balances')
@UseGuards(JwtAuthGuard)
export class BalancesController {
  constructor(
    private prisma: PrismaService,
    private balances: BalancesService,
  ) {}

  @Get()
  async getGroupBalances(
    @Req() req: any,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ) {
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: req.user.id } },
      select: { id: true },
    });
    if (!membership) throw new NotFoundException('Group not found');
    return this.balances.getGroupBalances(groupId);
  }
}
