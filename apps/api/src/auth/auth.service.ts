import {
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../common/prisma.service';
import { UsersService } from '../users/users.service';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private users: UsersService,
    private jwt: JwtService,
    private email: EmailService,
  ) {}

  private createVerificationToken() {
    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    return { token, tokenHash, expiresAt };
  }

  private async prepareVerificationToken(userId: string): Promise<string> {
    const { token, tokenHash, expiresAt } = this.createVerificationToken();
    await this.prisma.emailVerificationToken.upsert({
      where: { userId },
      create: { userId, tokenHash, expiresAt },
      update: { tokenHash, expiresAt, lastSentAt: null },
    });
    return token;
  }

  private async markVerificationEmailSent(userId: string): Promise<void> {
    await this.prisma.emailVerificationToken.update({
      where: { userId },
      data: { lastSentAt: new Date() },
    });
  }

  private async findUserByEmail(email: string) {
    const trimmedEmail = email.trim();
    const exactMatch = await this.users.findByEmail(trimmedEmail);
    if (exactMatch || trimmedEmail === trimmedEmail.toLowerCase()) return exactMatch;
    return this.users.findByEmail(trimmedEmail.toLowerCase());
  }

  async register(email: string, name: string, password: string) {
    const passwordHash = await argon2.hash(password);
    try {
      const user = await this.users.create(email.trim().toLowerCase(), name, passwordHash);
      const token = await this.prepareVerificationToken(user.id);
      let verificationEmailSent = true;
      try {
        await this.email.sendVerificationEmail(user.email, user.name ?? 'there', token);
      } catch (error) {
        if (!(error instanceof ServiceUnavailableException)) throw error;
        verificationEmailSent = false;
        this.logger.error('Could not deliver a new-account verification email.', error);
      }
      if (verificationEmailSent) await this.markVerificationEmailSent(user.id);
      return {
        user: { id: user.id, email: user.email, name: user.name },
        verificationEmailSent,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }
  }

  async validateUser(email: string, password: string) {
    const user = await this.findUserByEmail(email);
    if (!user) return null;
    const ok = await argon2.verify(user.passwordHash, password).catch(() => false);
    if (!ok) return null;
    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException('Please verify your email address before logging in.');
    }
    return user;
  }

  async resendVerificationEmail(email: string) {
    const genericResponse = {
      message: 'If an unverified account exists for this email, a verification link will be sent.',
    };
    const user = await this.findUserByEmail(email);
    if (!user || user.emailVerifiedAt) return genericResponse;

    const current = await this.prisma.emailVerificationToken.findUnique({
      where: { userId: user.id },
    });
    const now = new Date();
    const resendCooldownMs = 60 * 1000;
    if (current?.lastSentAt && now.getTime() - current.lastSentAt.getTime() < resendCooldownMs) {
      return genericResponse;
    }

    const token = await this.prepareVerificationToken(user.id);
    await this.email.sendVerificationEmail(user.email, user.name ?? 'there', token);
    await this.markVerificationEmailSent(user.id);
    return genericResponse;
  }

  async verifyEmail(token: string): Promise<boolean> {
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return false;

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const stored = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });
    const now = new Date();
    if (!stored || stored.expiresAt <= now) return false;

    return this.prisma.$transaction(async transaction => {
      const deleted = await transaction.emailVerificationToken.deleteMany({
        where: {
          id: stored.id,
          tokenHash,
          expiresAt: { gt: now },
        },
      });
      if (deleted.count !== 1) return false;

      await transaction.user.update({
        where: { id: stored.userId },
        data: { emailVerifiedAt: now },
      });
      return true;
    });
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
