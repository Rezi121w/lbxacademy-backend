import { Injectable } from '@nestjs/common';
// Repository //
import {CourseRepository} from "./course.repository";

@Injectable()
export class CourseService {
    constructor(private readonly courseRepository: CourseRepository) {}

    async getAllCourses() {
        return await this.courseRepository.findAll();
    }

    async getMyCourses(id: number) {
        return await this.courseRepository.findUserCourses(id);
    }

}
