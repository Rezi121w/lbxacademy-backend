import {Controller, Get, UseGuards, Request, Post, Body} from '@nestjs/common';
import { CourseService } from './course.service';
// Roles //
import {RolesGuard} from "../guards/role.guard";
import {Roles} from "../guards/roles.decorator";
import {UserRole} from "../user-role";
// Dtos //
import {CreateCourseDto} from "./dtos/create-course.dto";


@Controller('course')
@UseGuards(RolesGuard)
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get()
  @Roles(UserRole.user)
  async getMyCourses(@Request() req: any) {
    return await this.courseService.getMyCourses(req.user.id);
  }

  // Admin Functions //

  @Get("/all")
  @Roles(UserRole.admin)
  async getAllCourses() {
    return await this.courseService.getAllCourses();
  }

  @Post()
  @Roles(UserRole.admin)
  async createCourse(@Body() data: CreateCourseDto) {

  }

}
