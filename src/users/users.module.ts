import {Global, Module} from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import * as dotenv from 'dotenv';
import {TypeOrmModule} from "@nestjs/typeorm";
// Entities //
import {UserEntity} from "../entities/user.entity";
import {CourseEntity} from "../entities/course.entity";
// JWT Module //
import { JwtModule } from '@nestjs/jwt';
// Repositories //
import {UsersRepository} from "./users.repository";
import {CourseRepository} from "../course/course.repository";
// Roles //
import {RolesGuard} from "../guards/role.guard";

dotenv.config();
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, CourseEntity]),
    JwtModule.register({
      secret: process.env.JWT_TOKEN_SECRET,
      signOptions: {expiresIn: process.env.JWT_EXPIRATION_TIME}
    })],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, CourseRepository, RolesGuard],
  exports: [UsersService, JwtModule],
})
export class UsersModule {}
