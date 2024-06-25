import {TypeOrmModule} from "@nestjs/typeorm";
import { Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
// Entities //
import {CourseEntity} from "../entities/course.entity";
import {UserEntity} from "../entities/user.entity";
// Guards //
import {RolesGuard} from "../guards/role.guard";
// Repository //
import {CourseRepository} from "./course.repository";
import {UsersRepository} from "../users/users.repository";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, CourseEntity])],
  controllers: [CourseController],
  providers: [CourseService, CourseRepository, UsersRepository, RolesGuard],
})
export class CourseModule {}
