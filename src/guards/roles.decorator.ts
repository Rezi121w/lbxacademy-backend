import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../user-role';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
