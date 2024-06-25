import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
// Entities //
import {UserEntity} from "../entities/user.entity";
// Dtos //
import {CreateUserDto} from "./dtos/create-user.dto";
import {UserRole} from "../user-role";


@Injectable()
export class UsersRepository {
    constructor(@InjectRepository(UserEntity) private userEntity: Repository<UserEntity>) {}

    async findAllUsers() {
        return await this.userEntity.findBy({role: UserRole.user});
    }

    async searchStudents(search: string) {
        return await this.userEntity.createQueryBuilder('user')
            .where('user.userName LIKE :search', { search: `%${search}%` })
            .andWhere('user.role = :role', { role: 'user' })
            .getMany();
    }

    async findAllAdmins() {
        return await this.userEntity.findBy({role: UserRole.admin});
    }

    async searchAdmins(search: string) {
        return await this.userEntity.createQueryBuilder('user')
            .where('user.userName LIKE :search', { search: `%${search}%` })
            .andWhere('user.role = :role', { role: 'admin' })
            .getMany();
    }

    create(data: CreateUserDto) {
        return this.userEntity.create(data);
    }

    async save(user: UserEntity) {
        user.userName = `${user.firstName} ${user.lastName}`;

        return await this.userEntity.save(user);
    }

    async softDelete(id: number) {
        await this.userEntity.softDelete(id);
    }

    // Find One //

    async findOneByUserName(username: string) {
        return await this.userEntity.findOneBy({userName: username});
    }

    async findOneById(id: number) {
        return await this.userEntity.findOneBy({id: id});
    }

}
