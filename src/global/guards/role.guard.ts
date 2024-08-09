import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../../auth/auth.service';
// Roles //
import { UserRoles } from '../../user-roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.get<UserRoles[]>(
      'roles',
      context.getHandler(),
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const payload = await this.authService.getAccessToken(
      request.headers.authorization,
    );

    if (!payload) {
      throw new HttpException('UnAuthorized', HttpStatus.FORBIDDEN);
    }
    if (payload.isRefreshToken) {
      throw new UnauthorizedException('This is Refresh Token!');
    }

    const hasAccess = this.matchRoles(requiredRoles, payload.role);

    if (!hasAccess) {
      throw new HttpException('You aren`t admin!', 460);
    }

    request['user'] = payload;
    return hasAccess;
  }

  matchRoles(requiredRoles: UserRoles[], userRole: UserRoles) {
    const roleHierarchy = {
      [UserRoles.admin]: [UserRoles.admin, UserRoles.user],
      [UserRoles.user]: [UserRoles.user],
    };

    return requiredRoles.some((role) => roleHierarchy[userRole].includes(role));
  }
}
