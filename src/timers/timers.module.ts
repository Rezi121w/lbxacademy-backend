import { Module } from '@nestjs/common';
import { TimersController } from './timers.controller';
import { TimersService } from './timers.service';
import { TimersRepository } from './timers.repository';
// TypeORM //
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimerEntity } from './entities/timer.entity';
// Modules //
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([TimerEntity]), MailModule],
  controllers: [TimersController],
  providers: [TimersService, TimersRepository],
})
export class TimersModule {}
