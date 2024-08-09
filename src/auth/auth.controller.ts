import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
// DTos //
import { LoginUserDto } from './dto/login-user.dto';
import { SendOtpDto } from './dto/send-otp.dto';
// __GUARDS__ //
import { Throttle } from '@nestjs/throttler';
// Swagger UI //
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('auth')
@ApiTags('Authorization')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @ApiOperation({ summary: 'Attempt To Login User' })
  @ApiResponse({
    status: 201,
    description:
      'Returns Login Sessions INFO Object Like {accessToken:***, refreshToken:***}',
    type: Object,
  })
  async login(@Body() data: LoginUserDto) {
    return this.authService.login(data);
  }

  @Post('/email')
  @ApiOperation({ summary: 'Attempt To Send otpCode' })
  @ApiResponse({
    status: 201,
    description: 'send Otp Code To Email',
    type: Object,
  })
  async sendMail(@Body() data: SendOtpDto) {
    return this.authService.sendOtpCode(data.email);
  }

  // Refresh Token //

  @Get('/refresh')
  @Throttle({ SHORT: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Get New AccessToken' })
  @ApiResponse({
    status: 200,
    description: 'Returns {accessToken: ***}',
    type: Object,
  })
  async refreshToken(@Headers('Authorization') header: any) {
    return await this.authService.refreshToken(header);
  }
}
