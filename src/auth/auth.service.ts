import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Expose, plainToClass } from 'class-transformer';
// DayJS Time //
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
// DTos //
import { LoginUserDto } from './dto/login-user.dto';
// Repository And Service //
import { UsersRepository } from '../users/users.repository';
import { MailService } from '../mail/mail.service';

dayjs.extend(utc);

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  // Login Function //
  async login(data: LoginUserDto) {
    const user = await this.usersRepository.findOneByEmail(data.email);

    if (!user) {
      throw new HttpException(
        'მომხმარებელი ვერ მოიძებნა!',
        HttpStatus.BAD_REQUEST,
      );
    } else if (user.otpAttemptCount >= 5) {
      user.otpCode = null;
      user.otpAttemptCount = 0;

      await this.usersRepository.save(user);
      throw new HttpException(
        'ცდების რაოდენობა ამოწურულია!',
        HttpStatus.FORBIDDEN,
      );
    }

    const timeElapsed = this.isOtpOutDated(user.otpReportedAt);
    if (timeElapsed > 15) {
      throw new HttpException('კოდის ვადა გასულია!', HttpStatus.FORBIDDEN);
    }

    const isOtpCorrect = user.otpCode === data.otpCode && data.otpCode != null;
    if (!isOtpCorrect) {
      user.otpAttemptCount++;
      await this.usersRepository.save(user);

      throw new HttpException('არასწორი კოდი!', HttpStatus.UNAUTHORIZED);
    }

    user.otpCode = null;
    user.otpAttemptCount = 0;
    user.otpReportedAt = null;
    await this.usersRepository.save(user);
    const refreshToken = this.jwtService.sign(
      { id: user.id, isRefreshToken: true },
      { expiresIn: '30d' },
    );

    const result = {
      id: user.id,
      role: user.role,
      accessToken: `${this.jwtService.sign({ id: user.id, role: user.role })}`,
      refreshToken: `${refreshToken}`,
    };

    return plainToClass(LoginReturn, result);
  }

  async sendOtpCode(email: string) {
    const user = await this.usersRepository.findOneByEmail(email);

    if (!user) {
      throw new HttpException(
        'მომხმარებელი ვერ მოიძებნა!',
        HttpStatus.BAD_REQUEST,
      );
    }

    const timeElapsed = this.isOtpOutDated(user.otpReportedAt);
    if (timeElapsed < 10) {
      throw new HttpException('დაელოდეთ 10 წუთი 😁', HttpStatus.FORBIDDEN);
    }

    user.otpCode = Math.floor(100000 + Math.random() * 900000);
    user.otpAttemptCount = 0;
    user.otpReportedAt = dayjs.utc().toDate();

    await this.usersRepository.save(user);

    this.mailService.sendTemplatedEmail('otpCode', [user.email], {
      fullName: `${user.firstName} ${user.lastName}`,
      otpCode: user.otpCode,
    });
    throw new HttpException('კოდი წარმატებით გაიგზავნა', HttpStatus.CREATED);
  }

  // Refresh Token //
  async refreshToken(authorizationHeader: string) {
    if (!authorizationHeader) {
      throw new UnauthorizedException('UnAuthorized');
    }

    const [bearer, token] = authorizationHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Unknown Token Type');
    }

    let payload;

    try {
      payload = this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('UnAuthorized');
    }

    if (!payload) {
      throw new HttpException('UnAuthorized', HttpStatus.FORBIDDEN);
    } else if (!payload.isRefreshToken) {
      throw new HttpException(
        'Sorry Hacker, But It Is Access Token!',
        HttpStatus.FORBIDDEN,
      );
    } else if (payload.exp <= Date.now() / 1000) {
      throw new HttpException('Token Expired!', HttpStatus.FORBIDDEN);
    }

    const user = await this.usersRepository.findOneById(payload.id);

    return plainToClass(LoginReturn, {
      accessToken: `${this.jwtService.sign({ id: payload.id, role: user.role })}`,
    });
  }

  // Get Access Token Payload //
  async getAccessToken(authorizationHeader: string) {
    if (!authorizationHeader) {
      throw new UnauthorizedException('UnAuthorized');
    }

    const [bearer, token] = authorizationHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Unknown Token');
    }

    let payload;

    try {
      payload = this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }

    return payload;
  }

  // Private //
  private isOtpOutDated(otpReportedAt: Date) {
    const otpReportedAtUTC = dayjs.utc(otpReportedAt);
    return dayjs().utc().diff(otpReportedAtUTC, 'minute');
  }
}

class LoginReturn {
  @Expose()
  id: number;

  @Expose()
  role: string;

  @Expose()
  accessToken: string;

  @Expose()
  refreshToken: string;
}
