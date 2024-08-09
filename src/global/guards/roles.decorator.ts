import { SetMetadata } from '@nestjs/common';
import { UserRoles } from '../../user-roles';

export const Roles = (...roles: UserRoles[]) => SetMetadata('roles', roles);
