import {
  Controller,
  Delete,
  Body,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min, MaxLength, MinLength } from 'class-validator';
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

class RegisterPushDeviceDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  token: string;

  @IsIn(['android', 'ios'])
  platform: string;
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private prisma: PrismaService) {}

  @Post('devices')
  async registerDevice(@Req() req: any, @Body() body: RegisterPushDeviceDto) {
    const device = await this.prisma.pushDeviceToken.upsert({
      where: { token: body.token },
      create: {
        token: body.token,
        platform: body.platform,
        userId: req.user.id,
      },
      update: {
        platform: body.platform,
        userId: req.user.id,
      },
      select: { id: true },
    });
    return { registered: true, id: device.id };
  }

  @Delete('devices')
  async unregisterDevice(@Req() req: any, @Body() body: RegisterPushDeviceDto) {
    await this.prisma.pushDeviceToken.deleteMany({
      where: { token: body.token, userId: req.user.id },
    });
    return { unregistered: true };
  }

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
