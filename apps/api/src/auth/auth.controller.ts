import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Res,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

class ResendVerificationDto {
  @IsEmail()
  email: string;
}

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
    return this.auth.register(dto.email, dto.name, dto.password);
  }

  @HttpCode(200)
  @Post('resend-verification')
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.auth.resendVerificationEmail(dto.email);
  }

  @Get('verify-email')
  async showEmailVerification(
    @Query('token') token: string | undefined,
    @Res() response: Response,
  ) {
    const isValidToken = typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token);
    const content = isValidToken
      ? `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Verify your email</title></head><body style="font-family:system-ui,sans-serif;max-width:30rem;margin:15vh auto;padding:1.5rem;color:#19352a"><h1>Verify your email</h1><p>Confirm your email address to finish creating your Money Splitzy account.</p><form method="post" action="/auth/verify-email/confirm?token=${encodeURIComponent(token)}"><button style="background:#167a4a;border:0;border-radius:8px;color:#fff;font-size:1rem;padding:.8rem 1.2rem" type="submit">Confirm email address</button></form></body></html>`
      : this.emailVerificationResult(false);

    return response
      .status(isValidToken ? 200 : 400)
      .set({
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
      })
      .send(content);
  }

  @HttpCode(200)
  @Post('verify-email/confirm')
  async confirmEmailVerification(
    @Query('token') token: string | undefined,
    @Res() response: Response,
  ) {
    const verified =
      typeof token === 'string' && (await this.auth.verifyEmail(token));
    return response
      .status(verified ? 200 : 400)
      .set({
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
      })
      .send(this.emailVerificationResult(verified));
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

  private emailVerificationResult(verified: boolean): string {
    const title = verified ? 'Email verified' : 'Link invalid or expired';
    const message = verified
      ? 'Your email address is verified. You can now sign in to Money Splitzy.'
      : 'This verification link is invalid, expired, or has already been used. Request a new link in the app.';
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head><body style="font-family:system-ui,sans-serif;max-width:30rem;margin:15vh auto;padding:1.5rem;color:#19352a"><h1>${title}</h1><p>${message}</p></body></html>`;
  }
}
