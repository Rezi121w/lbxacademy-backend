import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(UserEntity) private usersEntity: Repository<UserEntity>,
  ) {}

  async findUsers(search?: string) {
    const query = this.usersEntity
      .createQueryBuilder('user')
      .where('user.role = :role', { role: 'user' });

    if (search) {
      query
        .andWhere('user.email LIKE :search', { search: `%${search}%` })
        .orWhere('user.firstName LIKE :search', { search: `%${search}%` })
        .orWhere('user.lastName LIKE :search', { search: `%${search}%` });
    }

    return await query.getMany();
  }

  async findAdmins(search?: string) {
    const query = this.usersEntity
      .createQueryBuilder('user')
      .where('user.role = :role', { role: 'admin' });

    if (search) {
      query
        .andWhere('user.email LIKE :search', { search: `%${search}%` })
        .orWhere('user.firstName LIKE :search', { search: `%${search}%` })
        .orWhere('user.lastName LIKE :search', { search: `%${search}%` });
    }

    return await query.getMany();
  }

  async findOneById(id: number) {
    return await this.usersEntity.findOneBy({ id: id });
  }

  async findOneByEmail(email: string) {
    return await this.usersEntity.findOneBy({ email: email });
  }

  async addDailyMinutes() {
    await this.usersEntity.update(
      {},
      {
        remainingMinutes: () => 'remainingMinutes + 40',
      },
    );
  }

  create(data: Object) {
    return this.usersEntity.create(data);
  }

  async save(user: UserEntity) {
    return await this.usersEntity.save(user);
  }

  async softDelete(id: number) {
    return await this.usersEntity.softDelete(id);
  }
}
