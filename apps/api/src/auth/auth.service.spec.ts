import { createHash } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../common/prisma.service';
import { UsersService } from '../users/users.service';
import { EmailService } from './email.service';
import { AuthService } from './auth.service';

type MockTransaction = {
  emailVerificationToken: { deleteMany: jest.Mock };
  user: { update: jest.Mock };
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    emailVerificationToken: {
      findUnique: jest.Mock;
      deleteMany: jest.Mock;
      upsert: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let users: { findByEmail: jest.Mock; create: jest.Mock };
  let email: { sendVerificationEmail: jest.Mock };
  let deleteVerificationToken: jest.Mock;
  let updateUser: jest.Mock;

  beforeEach(() => {
    deleteVerificationToken = jest.fn().mockResolvedValue({ count: 1 });
    updateUser = jest.fn().mockResolvedValue({});
    const transaction: MockTransaction = {
      emailVerificationToken: { deleteMany: deleteVerificationToken },
      user: { update: updateUser },
    };
    prisma = {
      emailVerificationToken: {
        findUnique: jest.fn(),
        deleteMany: deleteVerificationToken,
        upsert: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn((callback: (client: MockTransaction) => unknown) =>
        callback(transaction),
      ),
    };
    users = { findByEmail: jest.fn(), create: jest.fn() };
    email = { sendVerificationEmail: jest.fn() };

    service = new AuthService(
      prisma as unknown as PrismaService,
      users as unknown as UsersService,
      {} as JwtService,
      email as unknown as EmailService,
    );
  });

  it('verifies a valid token once and never stores the raw token', async () => {
    const token = Buffer.alloc(32, 7).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    prisma.emailVerificationToken.findUnique.mockResolvedValue({
      id: 'verification-token-id',
      tokenHash,
      userId: 'user-id',
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(service.verifyEmail(token)).resolves.toBe(true);

    expect(prisma.emailVerificationToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash },
    });
    expect(deleteVerificationToken).toHaveBeenCalledWith({
      where: {
        id: 'verification-token-id',
        tokenHash,
        expiresAt: expect.objectContaining({ gt: expect.any(Date) }),
      },
    });
    expect(updateUser).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { emailVerifiedAt: expect.any(Date) },
    });
  });

  it('does not consume malformed, expired, or previously consumed tokens', async () => {
    await expect(service.verifyEmail('not-a-token')).resolves.toBe(false);
    expect(prisma.emailVerificationToken.findUnique).not.toHaveBeenCalled();

    const token = Buffer.alloc(32, 8).toString('base64url');
    prisma.emailVerificationToken.findUnique.mockResolvedValue({
      id: 'expired-token',
      userId: 'user-id',
      expiresAt: new Date(Date.now() - 1),
    });
    await expect(service.verifyEmail(token)).resolves.toBe(false);
    expect(deleteVerificationToken).not.toHaveBeenCalled();

    prisma.emailVerificationToken.findUnique.mockResolvedValue({
      id: 'already-consumed-token',
      userId: 'user-id',
      expiresAt: new Date(Date.now() + 60_000),
    });
    deleteVerificationToken.mockResolvedValue({ count: 0 });
    await expect(service.verifyEmail(token)).resolves.toBe(false);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('does not send another verification email during the resend cooldown', async () => {
    users.findByEmail.mockResolvedValue({
      id: 'user-id',
      email: 'person@example.com',
      name: 'Person',
      emailVerifiedAt: null,
    });
    prisma.emailVerificationToken.findUnique.mockResolvedValue({
      lastSentAt: new Date(),
    });

    await expect(service.resendVerificationEmail('person@example.com')).resolves.toEqual({
      message: 'If an unverified account exists for this email, a verification link will be sent.',
    });
    expect(email.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('creates an unverified account without issuing authentication tokens', async () => {
    users.create.mockResolvedValue({
      id: 'user-id',
      email: 'person@example.com',
      name: 'Person',
    });

    const result = await service.register('Person@Example.com', 'Person', 'password123');

    expect(users.create).toHaveBeenCalledWith(
      'person@example.com',
      'Person',
      expect.any(String),
    );
    expect(prisma.emailVerificationToken.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-id' },
      create: {
        userId: 'user-id',
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      },
      update: {
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
        lastSentAt: null,
      },
    });
    expect(email.sendVerificationEmail).toHaveBeenCalledWith(
      'person@example.com',
      'Person',
      expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
    );
    expect(result).toEqual({
      user: { id: 'user-id', email: 'person@example.com', name: 'Person' },
      verificationEmailSent: true,
    });
    expect(result).not.toHaveProperty('access');
    expect(result).not.toHaveProperty('refresh');
  });

  it('blocks login until the email address is verified', async () => {
    const passwordHash = await argon2.hash('password123');
    users.findByEmail.mockResolvedValue({
      id: 'user-id',
      email: 'person@example.com',
      passwordHash,
      emailVerifiedAt: null,
    });

    await expect(
      service.validateUser('person@example.com', 'password123'),
    ).rejects.toThrow('Please verify your email address before logging in.');
  });
});
