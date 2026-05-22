import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { UserRoles } from '@/core/constants/constants';

const mockReflector = { get: jest.fn() };

function makeContext(role?: string) {
  return {
    getHandler: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user: role ? { role } : undefined }),
    }),
  } as any;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access if user has required role', () => {
    mockReflector.get.mockReturnValue([UserRoles.user]);
    const ctx = makeContext(UserRoles.user);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw ForbiddenException if user lacks required role', () => {
    mockReflector.get.mockReturnValue([UserRoles.admin]);
    const ctx = makeContext(UserRoles.user);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should use viewer role if no user in request', () => {
    mockReflector.get.mockReturnValue([UserRoles.admin]);
    const ctx = makeContext();
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
