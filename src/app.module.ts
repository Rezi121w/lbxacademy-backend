import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
// TypeOrm Config //
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
// __GUARDS__ //
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
// All Modules //
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { TimersModule } from './timers/timers.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.MYSQL_HOST,
      port: 16076,
      username: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASS,
      database: process.env.MYSQL_DBNAME,
      timezone: 'Z',
      autoLoadEntities: true,
      synchronize: true, // Only For Dev Mode //
    }),
    ThrottlerModule.forRoot([
      {
        name: 'AntiSpam',
        ttl: 200,
        limit: 5,
      },
      {
        name: 'SHORT',
        ttl: 30000,
        limit: 100,
      },
      {
        name: 'LONG',
        ttl: 600000,
        limit: 1000,
      },
    ]),
    MailModule,
    AuthModule,
    UsersModule,
    TimersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}
