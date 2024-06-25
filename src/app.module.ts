import { ClassSerializerInterceptor, Module } from "@nestjs/common";
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as dotenv from 'dotenv';
// TypeOrm Config //
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from '@nestjs/config';
// All Modules //
import { UsersModule } from "./users/users.module";
// __GUARDS__ //
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
// Entities //
import { UserEntity } from "./entities/user.entity";
import {CourseEntity} from "./entities/course.entity";
import {TechnologiesEntity} from "./entities/technologies.entity";
import { CourseModule } from './course/course.module';



const entities = [UserEntity, CourseEntity, TechnologiesEntity];
dotenv.config();
@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.MYSQL_HOST,
      port: 3306,
      username: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASS,
      database: process.env.MYSQL_DBNAME,
      entities: entities,
      synchronize: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: "SHORT",
        ttl: 30000,
        limit: 30,
      },
      {
        name: "LONG",
        ttl: 900000,
        limit: 200,
      }
    ]),
    UsersModule,
    CourseModule],
  controllers: [AppController],
  providers: [AppService,
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