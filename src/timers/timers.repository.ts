import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThan, Repository } from 'typeorm';
import { TimerEntity } from './entities/timer.entity';
// TIme //
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
// Enums //
import { TimerTypes } from './enums/timer-types';

dayjs.extend(utc);

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
    const currentDate = dayjs().utc().toDate();
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
    const currentDate = dayjs().utc();
    const fiveMinutesFromNow = currentDate.add(7, 'minute');

    const currentDateAsDate = currentDate.toDate();
    const fiveMinutesFromNowAsDate = fiveMinutesFromNow.toDate();

    return await this.timersEntity.find({
      where: {
        isActive: true,
        warningEmailSent: false,
        targetDate: Between(currentDateAsDate, fiveMinutesFromNowAsDate),
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
