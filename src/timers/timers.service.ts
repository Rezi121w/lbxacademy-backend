import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TimersRepository } from './timers.repository';
import { MailService } from '../mail/mail.service';
// TIme //
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
    return timer || (await this.createTimer(type, userId));
  }

  async changeActive(type: TimerTypes, userId: number) {
    const timer = await this.timersRepository.getTimer(type, userId);

    if (!timer) {
      throw new HttpException('ტაიმერი ვერ მოიძებნა!', HttpStatus.NOT_FOUND);
    }

    if (
      (timer.isActive && !this.canPauseTimer(timer.targetDate)) ||
      timer.lastPause.getTime() === timer.targetDate.getTime()
    ) {
      throw new HttpException('ტაიმერზე დრო აღარ გაქვს!', HttpStatus.FORBIDDEN);
    } else if (timer.isActive && this.canPauseTimer(timer.lastPause) <= 10) {
      throw new HttpException(
        'ტაიმერზე დაპაუზება შესაძლებელია 10 წუთში ერთხელ!',
        HttpStatus.FORBIDDEN,
      );
    }

    if (!timer.isActive) {
      const otherTimerActive =
        await this.timersRepository.isUserTimerAlreadyActive(userId);

      if (otherTimerActive) {
        throw new HttpException(
          'სხვა ტაიმერი უკვე ჩართული გაქვს!',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    timer.isActive = !timer.isActive;
    if (timer.isActive) {
      const lastPause = dayjs(timer.lastPause).utc();
      const targetDate = dayjs(timer.targetDate).utc();

      const secondsInStorage = targetDate.diff(lastPause, 'second');
      timer.targetDate = dayjs().utc().add(secondsInStorage, 'second').toDate();

      if (timer.user.parentEmail && timer.user.parentEmail.includes('@')) {
        this.mailService.sendTemplatedEmail(
          [timer.user.parentEmail],
          'სტუდენტის ტაიმერის შეტყობინება',
          'timerStart',
          {
            fullName: `${timer.user.firstName} ${timer.user.lastName}`,
            type: timer.type,
            minutes: Math.floor(secondsInStorage / 60),
          },
        );
      }
    } else {
      timer.lastPause = dayjs().utc().toDate();
      if (timer.user.parentEmail && timer.user.parentEmail.includes('@')) {
        const lastPause = dayjs(timer.lastPause).utc();
        const targetDate = dayjs(timer.targetDate).utc();

        await this.mailService.sendTemplatedEmail(
          [timer.user.parentEmail],
          'სტუდენტის ტაიმერის შეტყობინება',
          'timerPause',
          {
            fullName: `${timer.user.firstName} ${timer.user.lastName}`,
            type: timer.type,
            minutes: targetDate.diff(lastPause, 'minute'),
          },
        );
      }
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
      throw new HttpException('ტაიმერი ვერ მოიძებნა!', HttpStatus.NOT_FOUND);
    }

    if (timer.isActive) {
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

    timer.targetDate = dayjs(timer.targetDate)
      .utc()
      .add(minutes * timer.courseValue, 'minutes')
      .toDate();
    timer.user.remainingMinutes -= minutes;

    await this.timersRepository.save(timer);
    throw new HttpException(
      'ტაიმერს დრო წარმატებით დაემატა!',
      HttpStatus.ACCEPTED,
    );
  }

  @Cron('* * * * *')
  async checkTimers() {
    const expiredTimers = await this.timersRepository.getExpiredTimers();
    const now = dayjs().utc().toDate();

    const updates = expiredTimers.map(async (timer) => {
      timer.isActive = false;
      timer.warningEmailSent = false;

      const lastPause = dayjs(timer.lastPause).utc();
      const targetDate = dayjs(timer.targetDate).utc();

      this.mailService.sendTemplatedEmail(
        [
          timer.user.email,
          timer.user.parentEmail && timer.user.parentEmail.includes('@')
            ? timer.user.parentEmail
            : '',
        ],
        'სტუდენტის ტაიმერის დასრულების შეტყობინება',
        'timerEnd',
        {
          fullName: `${timer.user.firstName} ${timer.user.lastName}`,
          type: timer.type,
          duration: targetDate.diff(lastPause, 'minute'),
        },
      );

      timer.lastPause = now;
      timer.targetDate = now;

      return this.timersRepository.save(timer);
    });

    await Promise.all(updates);
  }

  @Cron('* * * * *')
  async sendWarningMessage() {
    const timers = await this.timersRepository.getTimersWithin5Minutes();

    const updates = timers.map(async (timer) => {
      timer.warningEmailSent = true;

      this.mailService.sendTemplatedEmail(
        [timer.user.email],
        'სტუდენტო დაგრჩა 5 წუთი!',
        'timerWarning',
        {
          fullName: `${timer.user.firstName} ${timer.user.lastName}`,
          type: timer.type,
        },
      );

      return this.timersRepository.save(timer);
    });

    await Promise.all(updates);
  }

  private async createTimer(type: TimerTypes, userId: number) {
    const newTimer = this.timersRepository.create();

    newTimer.type = type;
    newTimer.userId = userId;
    newTimer.lastPause = dayjs().utc().toDate();
    newTimer.targetDate = dayjs().utc().add(1, 'minute').toDate();

    try {
      return await this.timersRepository.save(newTimer);
    } catch (error) {
      throw new HttpException(
        'მომხმარებელი ვერ მოიძებნა!',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  private canPauseTimer(lastPause: Date): number {
    if (!lastPause) return Infinity;
    const now = dayjs().utc();
    const lastPauseUTC = dayjs(lastPause).utc();
    return now.diff(lastPauseUTC, 'minute');
  }
}
