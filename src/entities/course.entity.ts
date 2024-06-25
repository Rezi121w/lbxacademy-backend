import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity, JoinTable, ManyToMany, OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import { Exclude, Expose } from "class-transformer";
// Other Entities //
import {UserEntity} from "./user.entity";
import {TechnologiesEntity} from "./technologies.entity";


@Entity('courses')
export class CourseEntity {

    @Expose()
    @PrimaryGeneratedColumn()
    id!: number;

    @Expose()
    @Column()
    name!: string;

    @Expose()
    @Column({nullable: true})
    meetingLink!: string;

    @Expose()
    @Column()
    isMain: boolean;

    @Expose()
    @Column()
    abbr!: string;

    @Exclude()
    @ManyToMany(() => UserEntity, user => user.learningCourses)
    users!: UserEntity[];

    @Expose()
    @OneToMany(() => TechnologiesEntity, technology => technology.course)
    @JoinTable()
    technologies!: TechnologiesEntity[];

    @Exclude()
    @CreateDateColumn()
    createdAt!: Date;

    @Exclude()
    @UpdateDateColumn()
    updatedAt!: Date;

    @Exclude()
    @DeleteDateColumn()
    deletedAt!: Date;

}
