import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TimerTypes } from '../enums/timer-types';
import { ApiProperty } from '@nestjs/swagger';

export class GetTimerDto {
  @ApiProperty({
    description: 'The type Of Timer (phone, tv, playstation)',
    example: 'phone',
  })
  @IsEnum(TimerTypes)
  @IsString()
  @IsNotEmpty()
  type!: TimerTypes;
}
