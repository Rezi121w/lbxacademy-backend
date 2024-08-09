import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThan, Repository } from 'typeorm';
import { TimerEntity } from './entities/timer.entity';
// Enums //
import { TimerTypes } from './enums/timer-types';

@Injectable()
export class TimersRepository {
  constructor(
    @InjectRepository(TimerEntity)
    private timersEntity: Repository<TimerEntity>,
  ) {}

  async isUserTimerAlreadyActive(userId: number) {
    return await this.timersEntity.count({
      where: { isActive: true, userId: userId },
    });
  }

  async getTimer(type: TimerTypes, userId: number) {
    return await this.timersEntity.findOne({
      where: { type: type, userId: userId },
      relations: { user: true },
    });
  }

  async getExpiredTimers() {
    const currentDate = new Date();
    return await this.timersEntity.find({
      where: {
        isActive: true,
        targetDate: LessThan(currentDate),
      },
      relations: {
        user: true,
      },
    });
  }

  async getTimersWithin5Minutes() {
    const currentDate = new Date();
    const fiveMinutesFromNow = new Date(currentDate.getTime() + 5 * 60 * 1000);

    return await this.timersEntity.find({
      where: {
        isActive: true,
        warningEmailSent: false,
        targetDate: Between(currentDate, fiveMinutesFromNow),
      },
      relations: {
        user: true,
      },
    });
  }

  create() {
    return this.timersEntity.create();
  }

  async save(timer: TimerEntity) {
    return await this.timersEntity.save(timer);
  }
}
