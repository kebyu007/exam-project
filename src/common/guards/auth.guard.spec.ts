import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { Reflector } from '@nestjs/core';
import { JwtService, JsonWebTokenError, TokenExpiredError } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

const mockReflector = { get: jest.fn() };
const mockJwtService = { verifyAsync: jest.fn(), signAsync: jest.fn() };
const mockConfigService = { getOrThrow: jest.fn(), get: jest.fn() };

function makeContext(overrides: Partial<{ signedCookies: any; user: any }> = {}) {
  const req = { signedCookies: {}, ...overrides };
  const res = { cookie: jest.fn() };
  return {
    getHandler: jest.fn(),
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
    req,
    res,
  } as any;
}

describe('AuthGuard', () => {
  let guard: AuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access if route is not protected', async () => {
    mockReflector.get.mockReturnValue(false);
    const ctx = makeContext();
    expect(await guard.canActivate(ctx)).toBe(true);
  });

  it('should throw UnauthorizedException if no tokens', async () => {
    mockReflector.get.mockReturnValue(true);
    const ctx = makeContext({ signedCookies: {} });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should verify access token and set req.user', async () => {
    mockReflector.get.mockReturnValue(true);
    const payload = { id: '1', role: 'user' };
    mockJwtService.verifyAsync.mockResolvedValue(payload);
    mockConfigService.getOrThrow.mockReturnValue('secret');

    const ctx = makeContext({ signedCookies: { accessToken: 'valid.token' } });
    await guard.canActivate(ctx);

    expect(ctx.req.user).toEqual(payload);
  });

  it('should refresh token if access token expired', async () => {
    mockReflector.get.mockReturnValue(true);
    const payload = { sub: '1', role: 'user' };
    mockJwtService.verifyAsync
      .mockRejectedValueOnce(new TokenExpiredError('expired', new Date()))
      .mockResolvedValueOnce(payload);
    mockJwtService.signAsync.mockResolvedValue('new.access.token');
    mockConfigService.getOrThrow.mockReturnValue('secret');
    mockConfigService.get.mockReturnValue('development');

    const ctx = makeContext({ signedCookies: { accessToken: 'expired.token', refreshToken: 'valid.refresh' } });
    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(ctx.res.cookie).toHaveBeenCalledWith('accessToken', 'new.access.token', expect.any(Object));
  });

  it('should throw UnauthorizedException for invalid access token', async () => {
    mockReflector.get.mockReturnValue(true);
    mockJwtService.verifyAsync.mockRejectedValue(new JsonWebTokenError('invalid'));
    mockConfigService.getOrThrow.mockReturnValue('secret');

    const ctx = makeContext({ signedCookies: { accessToken: 'bad.token' } });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should use refresh token if no access token', async () => {
    mockReflector.get.mockReturnValue(true);
    const payload = { sub: '1', role: 'user' };
    mockJwtService.verifyAsync.mockResolvedValue(payload);
    mockJwtService.signAsync.mockResolvedValue('new.access.token');
    mockConfigService.getOrThrow.mockReturnValue('secret');
    mockConfigService.get.mockReturnValue('development');

    const ctx = makeContext({ signedCookies: { refreshToken: 'valid.refresh' } });
    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
  });
});
