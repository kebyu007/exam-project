import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { protectedKey } from '../decorators/protected.decorator';
import { UserRoles } from '@/core/constants/constants';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isProtected = this.reflector.get<boolean>(
      protectedKey,
      context.getHandler(),
    );

    const http = context.switchToHttp();
    const req = http.getRequest<Request & { user: any }>();
    const res = http.getResponse<Response>();

    const accessToken = req.cookies?.['accessToken'];
    const refreshToken = req.cookies?.['refreshToken'];

    // For non-protected routes, try to set user but don't block
    if (!isProtected) {
      if (accessToken) {
        try {
          req.user = await this.verifyAccessToken(accessToken);
        } catch (error) {
          if (error instanceof TokenExpiredError && refreshToken) {
            try {
              req.user = await this.handleRefresh(refreshToken, res);
            } catch {
              // Ignore errors for non-protected routes
            }
          }
        }
      }
      return true;
    }

    // For protected routes, enforce authentication
    if (!accessToken && !refreshToken) {
      res.redirect('/login');
      return false;
    }

    if (!accessToken && refreshToken) {
      req.user = await this.handleRefresh(refreshToken, res);
      return true;
    }

    try {
      req.user = await this.verifyAccessToken(accessToken);
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        if (!refreshToken) {
          res.redirect('/login');
          return false;
        }
        req.user = await this.handleRefresh(refreshToken, res);
      } else {
        throw error;
      }
    }

    return true;
  }

  private async verifyAccessToken(token: string): Promise<any> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET') || 'secret',
      });
    } catch (error) {
      if (error instanceof TokenExpiredError) throw error;
      if (error instanceof JsonWebTokenError)
        throw new UnauthorizedException('Invalid access token.');
      throw new InternalServerErrorException('Token verification failed.');
    }
  }

  private async handleRefresh(
    refreshToken: string,
    res: Response,
  ): Promise<any> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'refresh-secret',
      });

      const newAccessToken = await this.generateAccessToken({
        id: payload.id,
        role: payload.role,
        full_name: payload.full_name,
        email: payload.email,
      });

      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: this.configService.get('NODE_ENV') === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return payload;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException(
          'Session fully expired. Please log in again.',
        );
      }
      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Invalid refresh token.');
      }
      throw new InternalServerErrorException('Failed to refresh session.');
    }
  }

  private async generateAccessToken(payload: {
    id: string;
    role: UserRoles;
    full_name: string;
    email: string;
  }): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET') || 'secret',
      expiresIn: this.configService.get('JWT_EXPIRES_IN') || '7d',
    });
  }
}
