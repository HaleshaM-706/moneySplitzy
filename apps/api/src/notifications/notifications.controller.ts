import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../common/prisma.service';

class NotificationQueryDto {
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
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(@Req() req: any, @Query() query: NotificationQueryDto) {
    const take = Math.min(query.pageSize, 200);
    return this.prisma.notification.findMany({
      where: { userId: req.user.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * take,
      take,
    });
  }

  @Patch(':notificationId/read')
  async markRead(
    @Req() req: any,
    @Param('notificationId', ParseUUIDPipe) notificationId: string,
  ) {
    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId: req.user.id, deletedAt: null },
      data: { read: true },
    });
    if (result.count === 0) throw new NotFoundException('Notification not found');
    return { id: notificationId, read: true };
  }
}
