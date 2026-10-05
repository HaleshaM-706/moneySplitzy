import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { UsersService } from '../users/users.service';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private users: UsersService, private jwt: JwtService) {}

  async register(email: string, name: string, password: string) {
    const passwordHash = await argon2.hash(password);
    const user = await this.users.create(email, name, passwordHash);
    return { id: user.id, email: user.email, name: user.name };
  }

  async validateUser(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) return null;
    const ok = await argon2.verify(user.passwordHash, password).catch(() => false);
    if (!ok) return null;
    return user;
  }

  signAccessToken(userId: string) {
    return this.jwt.sign({ sub: userId }, { expiresIn: '15m' });
  }

  async createRefreshToken(userId: string) {
    const token = randomUUID();
    const hash = await argon2.hash(token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days
    await this.prisma.refreshToken.create({ data: { tokenHash: hash, userId, expiresAt } });
    return token;
  }

  async rotateRefreshToken(userId: string, oldToken: string) {
    const tokens = await this.prisma.refreshToken.findMany({ where: { userId, revoked: false } });
    let matched = null as any;
    for (const t of tokens) {
      const ok = await argon2.verify(t.tokenHash, oldToken).catch(() => false);
      if (ok) {
        matched = t;
        break;
      }
    }
    if (!matched) throw new UnauthorizedException('Invalid refresh token');
    await this.prisma.refreshToken.update({ where: { id: matched.id }, data: { revoked: true } });
    return this.createRefreshToken(userId);
  }

  async logout(userId: string, token?: string) {
    if (token) {
      // revoke specific
      const all = await this.prisma.refreshToken.findMany({ where: { userId } });
      for (const t of all) {
        const ok = await argon2.verify(t.tokenHash, token).catch(() => false);
        if (ok) await this.prisma.refreshToken.update({ where: { id: t.id }, data: { revoked: true } });
      }
    } else {
      await this.prisma.refreshToken.updateMany({ where: { userId }, data: { revoked: true } });
    }
  }
}
