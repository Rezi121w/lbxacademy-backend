import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity, JoinTable, ManyToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm';
// Hashing And Hiding //
import * as bcrypt from "bcrypt";
import { Exclude, Expose } from "class-transformer";
// All_Roles //
import { UserRole } from '../user-role';
// Other Entities //
import {CourseEntity} from "./course.entity";


@Entity('users')
export class UserEntity {

    @Expose()
    @PrimaryGeneratedColumn()
    id!: number;

    @Expose()
    @Column({type: 'enum', enum: UserRole, default: UserRole.user})
    role!: UserRole;

    @Exclude()
    @Column()
    userName!: string;

    @Expose()
    @Column()
    firstName!: string;

    @Expose()
    @Column()
    lastName!: string;

    @Expose()
    @Column({nullable: true})
    profileImage!: string;

    @Expose()
    @Column({nullable: true})
    age!: number;

    @Expose()
    @Column({nullable: true})
    isBlocked: boolean;
    // JOINS //

    @Expose()
    @ManyToMany(() => CourseEntity, course => course.users, {eager: true})
    @JoinTable()
    learningCourses!: CourseEntity[];

    //

    @Exclude()
    @Column()
    private pass!: string;

    @Exclude()
    @Column({nullable: true})
    lastActivity: Date;

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

    async setPassword(pass: string) {
        this.pass = await bcrypt.hash(pass, process.env.bcrypt_hash);
    }

    async isPasswordCorrect(pass: string) {
        return await bcrypt.compare(pass, this.pass);
    }

}
