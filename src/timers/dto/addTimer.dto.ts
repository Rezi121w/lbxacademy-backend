import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TimerTypes } from '../enums/timer-types';

export class AddTimerDto {
  @ApiProperty({
    description: 'The type Of Timer (phone, tv, playstation)',
    example: 'phone',
  })
  @IsEnum(TimerTypes)
  @IsString()
  @IsNotEmpty()
  type!: TimerTypes;

  @ApiProperty({
    description: 'The type How Many Minutes To Add',
    example: '10',
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  time!: number;
}
