import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get('live')
  live() {
    return { status: 'ok', time: new Date().toISOString() };
  }

  @Get('ready')
  ready() {
    // In production check DB connectivity, migrations, etc.
    return { status: 'ready', time: new Date().toISOString() };
  }
}
