import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
// DTos //
import { CreateUserDto } from './dto/create-user.dto';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getMyInfo(id: number) {
    return await this.usersRepository.findOneById(id);
  }

  async getUsers(search?: string) {
    return await this.usersRepository.findUsers(search);
  }

  async getAdmins(search?: string) {
    return await this.usersRepository.findAdmins(search);
  }

  async createUser(data: CreateUserDto) {
    const exitingUser = await this.usersRepository.findOneByEmail(data.email);
    if (exitingUser) {
      throw new HttpException(
        'სტუდენტი ამ მეილით უკვე დარეგისტირებულია!',
        HttpStatus.BAD_REQUEST,
      );
    }

    const newUser = this.usersRepository.create(data);
    await this.usersRepository.save(newUser);

    throw new HttpException('სტუდენტი წარმატებით დაემატა', HttpStatus.CREATED);
  }

  // Note: Cron //
  @Cron('0 0 * * *')
  async addDailyMinutes() {
    await this.usersRepository.addDailyMinutes();
  }
}
