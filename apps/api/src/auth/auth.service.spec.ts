import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/prisma.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: {} },
        { provide: UsersService, useValue: {} },
        { provide: JwtService, useValue: { sign: jest.fn() } },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
