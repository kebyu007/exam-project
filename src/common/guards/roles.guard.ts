import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { rolesKey } from '../decorators/roles.decorator';
import { UserRoles } from '@/core/constants/constants';
import type { Request, Response } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.get(rolesKey, context.getHandler());

    if (!roles) return true;

    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request & { user?: any }>();
    const response = ctx.getResponse<Response>();

    const userRole = request?.user?.role || UserRoles.viewer;

    if (roles.includes(UserRoles.viewer)) return true;

    if (!roles.includes(userRole)) {
      // For page requests redirect to role's home, for API throw
      const accept = request.headers['accept'] || '';
      const isPage = accept.includes('text/html');
      if (isPage) {
        const home: Record<string, string> = {
          patient: '/patient/appointments',
          doctor: '/doctor/appointments',
          admin: '/admin',
        };
        response.redirect(home[userRole] || '/');
        return false;
      }
      throw new ForbiddenException("User don't have access");
    }

    return true;
  }
}
