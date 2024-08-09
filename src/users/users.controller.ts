import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
// Swagger UI //
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
// Roles-Guard //
import { RolesGuard } from '../global/guards/role.guard';
import { Roles } from '../global/guards/roles.decorator';
import { UserRoles } from '../user-roles';
// DTos //
import { SearchDto } from '../global/dto/search.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
@ApiTags('Users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get My INFO (Get User Info)' })
  @ApiResponse({
    status: 200,
    description: 'Returns userInfo',
    type: Object,
  })
  @Roles(UserRoles.user)
  async getMe(@Request() req: any) {
    return await this.usersService.getMyInfo(req.user.id);
  }

  // Note: Admin Functions //
  @Get()
  @ApiOperation({ summary: 'Get Users' })
  @ApiResponse({
    status: 200,
    description: 'Returns All Users (None Admins)',
    type: Array,
  })
  @Roles(UserRoles.admin)
  async getUsers(@Query() data?: SearchDto) {
    return await this.usersService.getUsers(data?.search);
  }

  @Get('admin')
  @ApiOperation({ summary: 'Get Admin Users' })
  @ApiResponse({
    status: 200,
    description: 'Returns Only Admins',
    type: Array,
  })
  @Roles(UserRoles.admin)
  async getAdmins(@Query() data?: SearchDto) {
    return await this.usersService.getAdmins(data?.search);
  }

  @Post()
  @ApiOperation({ summary: 'Create New User' })
  @ApiResponse({
    status: 201,
    description: 'Returns Success Message',
    type: Object,
  })
  @Roles(UserRoles.admin)
  async createUser(@Body() data: CreateUserDto) {
    return await this.usersService.createUser(data);
  }
}
