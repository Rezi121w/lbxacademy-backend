import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TimersRepository } from './timers.repository';
import { MailService } from '../mail/mail.service';
// DayJS Time //
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
// Enums //
import { TimerTypes } from './enums/timer-types';

dayjs.extend(utc);

@Injectable()
export class TimersService {
  constructor(
    private readonly timersRepository: TimersRepository,
    private readonly mailService: MailService,
  ) {}

  async getTimer(type: TimerTypes, userId: number) {
    const timer = await this.timersRepository.getTimer(type, userId);

    if (!timer) {
      return await this.createTimer(type, userId);
    }

    return timer;
  }

  async changeActive(type: TimerTypes, userId: number) {
    const timer = await this.timersRepository.getTimer(type, userId);

    if (
      !timer ||
      (timer.isActive && dayjs.utc().isAfter(timer.targetDate)) ||
      timer.targetDate.getTime() === timer.lastPause.getTime()
    ) {
      throw new HttpException('ტაიმერზე დრო აღარ გაქვს!', HttpStatus.FORBIDDEN);
    }

    if (timer.isActive && this.canPauseTimer(timer.lastPause) <= 10) {
      throw new HttpException(
        'ტაიმერზე დაპაუზება შესაძლებელია 10 წუთში ერთხელ!',
        HttpStatus.FORBIDDEN,
      );
    } else if (!timer.isActive) {
      const OtherTimerActive =
        await this.timersRepository.isUserTimerAlreadyActive(userId);
      if (OtherTimerActive)
        throw new HttpException(
          'სხვა ტაიმერი უკვე ჩართული გაქვს!',
          HttpStatus.FORBIDDEN,
        );
    }

    // Note: Function //

    timer.isActive = !timer.isActive;
    if (timer.isActive) {
      const lastPause = dayjs.utc(timer.lastPause);
      const targetDate = dayjs.utc(timer.targetDate);

      const secondsInStorage = targetDate.diff(lastPause, 'second');

      timer.targetDate = dayjs.utc().add(secondsInStorage, 'seconds').toDate();

      timer.user.parentEmail &&
        this.mailService.sendTemplatedEmail(
          'timeStart',
          [timer.user.parentEmail],
          {
            fullName: `${timer.user.firstName} ${timer.user.lastName}`,
            type: timer.type,
            minutes: dayjs.utc(timer.targetDate).diff(dayjs.utc(), 'minute'),
          },
        );
    } else {
      timer.lastPause = dayjs.utc().toDate();
      timer.user.parentEmail &&
        this.mailService.sendTemplatedEmail(
          'timePause',
          [timer.user.parentEmail],
          {
            fullName: `${timer.user.firstName} ${timer.user.lastName}`,
            type: timer.type,
            minutes: dayjs.utc(timer.targetDate).diff(dayjs.utc(), 'minute'),
          },
        );
    }

    await this.timersRepository.save(timer);
    throw new HttpException(
      `ტაიმერი წარმატებით ${timer.isActive ? 'გააქტიურდა' : 'გაითიშა'}`,
      HttpStatus.CREATED,
    );
  }

  async addMinutesTimer(type: TimerTypes, minutes: number, userId: number) {
    const timer = await this.timersRepository.getTimer(type, userId);

    if (!timer) {
      throw new HttpException('ტაიმერი ვერ მოიძებნა!', HttpStatus.FORBIDDEN);
    } else if (timer.isActive) {
      throw new HttpException(
        'ტაიმერი უკვე ჩართულია და დროის დამატება შეუძლებელია!',
        HttpStatus.FORBIDDEN,
      );
    }

    if (timer.user.remainingMinutes < minutes) {
      throw new HttpException(
        'საკმარისი დრო ბალანსზე არ გაქვს!',
        HttpStatus.FORBIDDEN,
      );
    }

    timer.targetDate = dayjs
      .utc(timer.targetDate)
      .add(minutes * timer.courseValue, 'minutes')
      .toDate();
    timer.user.remainingMinutes -= minutes;

    await this.timersRepository.save(timer);
    throw new HttpException(
      'ტაიმერს დრო წარმატებით დაემატა!',
      HttpStatus.ACCEPTED,
    );
  }

  // Note: CRON //
  @Cron('* * * * *')
  async checkTimers() {
    const expiredTimers = await this.timersRepository.getExpiredTimers();
    const utc = dayjs.utc().toDate();

    const updates = expiredTimers.map((timer) => {
      timer.isActive = false;
      timer.warningEmailSent = false;
      timer.lastPause = utc;
      timer.targetDate = utc;

      this.mailService.sendTemplatedEmail(
        'timeEnd',
        [timer.user.email, timer.user.parentEmail],
        {
          fullName: `${timer.user.firstName} ${timer.user.lastName}`,
          type: timer.type,
        },
      );
      this.timersRepository.save(timer);
    });

    await Promise.all(updates);
  }

  @Cron('* * * * *')
  async sendWarningMessage() {
    const timers = await this.timersRepository.getTimersWithin5Minutes();

    const updates = timers.map((timer) => {
      timer.warningEmailSent = true;

      this.mailService.sendTemplatedEmail(
        'timeWithInFiveMinutes',
        [timer.user.email],
        {
          fullName: `${timer.user.firstName} ${timer.user.lastName}`,
          type: timer.type,
        },
      );

      this.timersRepository.save(timer);
    });

    await Promise.all(updates);
  }

  // Note: Private //
  private async createTimer(type: TimerTypes, userId: number) {
    const newTimer = this.timersRepository.create();

    newTimer.type = type;
    newTimer.userId = userId;
    newTimer.lastPause = dayjs.utc().toDate();
    newTimer.targetDate = dayjs.utc().add(1, 'minute').toDate();

    try {
      return await this.timersRepository.save(newTimer);
    } catch (error) {
      throw new HttpException(
        'მომხმარებელი ვერ მოიძებნა!',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  private canPauseTimer(lastPause: Date) {
    const lastPauseInUtc = dayjs.utc(lastPause);
    return dayjs().utc().diff(lastPauseInUtc, 'minute');
  }
}
