import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
// JWT //
import { JwtModule } from '@nestjs/jwt';
import * as dotenv from 'dotenv';
// Modules //
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';

dotenv.config();

@Global()
@Module({
  imports: [
    UsersModule,
    MailModule,
    JwtModule.register({
      secret: process.env.JWT_TOKEN_SECRET,
      signOptions: {
        expiresIn: process.env.JWT_EXPIRATION_TIME,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
