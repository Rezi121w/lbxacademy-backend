import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TimersRepository } from './timers.repository';
import { MailService } from '../mail/mail.service';
// Enums //
import { TimerTypes } from './enums/timer-types';

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

    const now = new Date();

    if (
      (timer.isActive && now.getTime() > timer.targetDate.getTime()) ||
      timer.targetDate.getTime() == timer.lastPause.getTime()
    ) {
      throw new HttpException('ტაიმერზე დრო აღარ გაქვს!', HttpStatus.FORBIDDEN);
    }

    if (timer.isActive && this.canPauseTimer(timer.lastPause) <= 10) {
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
      const secondsInStorage = Math.floor(
        (timer.targetDate.getTime() - timer.lastPause.getTime()) / 1000,
      );
      timer.targetDate = new Date(now.getTime() + secondsInStorage * 1000);

      if (timer.user.parentEmail) {
        this.mailService.sendTemplatedEmail(
          'timeStart',
          [timer.user.parentEmail],
          {
            fullName: `${timer.user.firstName} ${timer.user.lastName}`,
            type: timer.type,
            minutes: Math.floor(
              (timer.targetDate.getTime() - now.getTime()) / 60000,
            ),
          },
        );
      }
    } else {
      timer.lastPause = now;
      if (timer.user.parentEmail) {
        this.mailService.sendTemplatedEmail(
          'timePause',
          [timer.user.parentEmail],
          {
            fullName: `${timer.user.firstName} ${timer.user.lastName}`,
            type: timer.type,
            minutes: Math.floor(
              (timer.targetDate.getTime() - now.getTime()) / 60000,
            ),
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

    timer.targetDate = new Date(
      timer.targetDate.getTime() + minutes * timer.courseValue * 60000,
    );
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
    const now = new Date();

    const updates = expiredTimers.map((timer) => {
      timer.isActive = false;
      timer.warningEmailSent = false;
      timer.lastPause = now;
      timer.targetDate = now;

      this.mailService.sendTemplatedEmail(
        'timeEnd',
        [timer.user.email, timer.user.parentEmail].filter(Boolean),
        {
          fullName: `${timer.user.firstName} ${timer.user.lastName}`,
          type: timer.type,
        },
      );
      return this.timersRepository.save(timer);
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

      return this.timersRepository.save(timer);
    });

    await Promise.all(updates);
  }

  private async createTimer(type: TimerTypes, userId: number) {
    const newTimer = this.timersRepository.create();

    newTimer.type = type;
    newTimer.userId = userId;
    newTimer.lastPause = new Date();
    newTimer.targetDate = new Date(Date.now() + 60000); // 1 minute from now

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
    return Math.floor((Date.now() - lastPause.getTime()) / 60000);
  }
}
