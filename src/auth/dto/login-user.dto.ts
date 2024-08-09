import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'This Is A Email Property!',
    example: 'test123@gmail.com',
  })
  email!: string;

  @ApiProperty({
    type: String,
    description: 'This Is A Otp Property!',
    example: '123456',
  })
  @IsNumber()
  @IsNotEmpty()
  otpCode!: number;
}
