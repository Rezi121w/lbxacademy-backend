import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity, ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import { Exclude, Expose } from "class-transformer";
import {CourseEntity} from "./course.entity";
// Other Entities //



@Entity('technologies')
export class TechnologiesEntity {

    @Expose()
    @PrimaryGeneratedColumn()
    id!: number;

    @Expose()
    @Column()
    name!: string;

    @Expose()
    @Column()
    abbr!: string;

    @Expose()
    @Column()
    image!: string;

    @Exclude()
    @ManyToOne(() => CourseEntity, course => course.technologies)
    course!: CourseEntity;

    @Exclude()
    @CreateDateColumn()
    createdAt!: Date;

    @Exclude()
    @UpdateDateColumn()
    updatedAt!: Date;

    @Exclude()
    @DeleteDateColumn()
    deletedAt!: Date;


    // Private Functions



}
