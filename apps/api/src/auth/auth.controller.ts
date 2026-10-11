import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

class RefreshTokenDto {
  @IsUUID()
  userId: string;

  @IsString()
  @IsNotEmpty()
  refresh: string;
}

class LogoutDto {
  @IsOptional()
  @IsString()
  refresh?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const user = await this.auth.register(dto.email, dto.name, dto.password);
    const access = this.auth.signAccessToken(user.id);
    const refresh = await this.auth.createRefreshToken(user.id);
    return { user: { id: user.id, email: user.email, name: user.name }, access, refresh };
  }

  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.auth.validateUser(dto.email, dto.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const access = this.auth.signAccessToken(user.id);
    const refresh = await this.auth.createRefreshToken(user.id);
    return { user: { id: user.id, email: user.email, name: user.name }, access, refresh };
  }

  @HttpCode(200)
  @Post('refresh')
  async refresh(@Body() body: RefreshTokenDto) {
    const token = await this.auth.rotateRefreshToken(body.userId, body.refresh);
    const access = this.auth.signAccessToken(body.userId);
    return { access, refresh: token };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: any, @Body() body: LogoutDto) {
    await this.auth.logout(req.user.id, body?.refresh);
    return { ok: true };
  }
}
