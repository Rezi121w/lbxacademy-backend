import {Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards} from '@nestjs/common';
import { UsersService } from './users.service';
// DTos //
import {LoginDto} from "./dtos/login.dto";
import {CreateUserDto} from "./dtos/create-user.dto";
import {ChangeUserDto} from "./dtos/change-user.dto";
// Roles //
import {RolesGuard} from "../guards/role.guard";
import {Roles} from "../guards/roles.decorator";
import {UserRole} from "../user-role";

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  @Roles(UserRole.user)
  async getMe(@Request() req:any) {
    return await this.usersService.getMe(req.user.id);
  }

  @Post("login")
  async login(@Body() data: LoginDto) {
    return await this.usersService.login(data);
  }

  // Admins Functions //

  @Get()
  @Roles(UserRole.admin)
  async getAllUsers(@Query("SearchByFullName") search?: string) {
    return await this.usersService.getAllUsers(search);
  }

  @Get("admins")
  @Roles(UserRole.admin)
  async getAllAdmins(@Query("SearchByFullName") search?: string) {
    return await this.usersService.getAllAdmins(search);
  }

  @Get(":id")
  @Roles(UserRole.admin)
  async getUser(@Param("id") id: number) {
    return await this.usersService.getUser(id);
  }

  @Post()
  @Roles(UserRole.admin)
  async createUser(@Body() data: CreateUserDto) {
    return await this.usersService.createUser(data);
  }


  @Put(":id")
  @Roles(UserRole.admin)
  async changeUser(@Param("id") id: number, @Body() data: ChangeUserDto) {
    return await this.usersService.changeUser(id, data);
  }

  @Delete("block/:id")
  @Roles(UserRole.admin)
  async blockUser(@Param("id") id: number) {
      return await this.usersService.blockUser(id);
  }

  @Delete(":id")
  @Roles(UserRole.admin)
  async deleteUser(@Param("id") id: number) {
    return await this.usersService.deleteUser(id);
  }

}
