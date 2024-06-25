import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {In, Repository} from "typeorm";
// Entities //
import {CourseEntity} from "../entities/course.entity";
// Repository //
import {UsersRepository} from "../users/users.repository";
import {CreateCourseDto} from "./dtos/create-course.dto";

@Injectable()
export class CourseRepository {
    constructor(@InjectRepository(CourseEntity) private courseEntity: Repository<CourseEntity>,
                private readonly usersRepository: UsersRepository) {}


    async addTechnologyToCourse(courseId: number) {
        const course = await this.courseEntity.findOneBy({id: courseId});
    }

    // Find Courses //

    async findAll() {
        return await this.courseEntity.find({ relations: ['technologies'] });
    }

    async findUserCourses(id: number) {
        const user = await this.usersRepository.findOneById(id);
        if (!user) {
            throw new Error('User not found');
        }

        const courseIds = user.learningCourses.map(course => course.id);
        return await this.courseEntity.find({
            where: { id: In(courseIds) },
            relations: ['technologies']
        });
    }

    async findByIds(ids: number[]) {
        return await this.courseEntity.findBy({id: In(ids)});
    }

    async findById(id: number) {
        return await this.courseEntity.findOneBy({id: id});
    }

    // Create And Save Course //

    create(data: CreateCourseDto) {
        return this.courseEntity.create(data);
    }

    async save(course: CourseEntity) {
        return await this.courseEntity.save(course);
    }

}
