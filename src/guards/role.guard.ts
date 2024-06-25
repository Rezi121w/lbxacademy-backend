import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
// Roles //
import { UserRole } from '../user-role';
import {UsersService} from "../users/users.service";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private usersService: UsersService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.get<UserRole[]>('roles', context.getHandler());

        if (!requiredRoles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const [payload, isBlocked] = await this.usersService.getAccessToken(request.headers.authorization);

        if (!payload) {
            throw new HttpException("UnAuthorized", HttpStatus.FORBIDDEN);
        }
        if(isBlocked) {
            throw new HttpException("Sorry, But You Are Blocked!", HttpStatus.FORBIDDEN);
        }

        request['user'] = await payload;
        return this.matchRoles(requiredRoles, payload.role);
    }

    matchRoles(requiredRoles: UserRole[], userRole: UserRole): boolean {
        const roleHierarchy = {
            [UserRole.admin]: [UserRole.admin, UserRole.user],
            [UserRole.user]: [UserRole.user],
        };

        return requiredRoles.some(role => roleHierarchy[userRole].includes(role));
    }
}
