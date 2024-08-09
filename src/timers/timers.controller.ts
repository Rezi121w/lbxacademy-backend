import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { TimersService } from './timers.service';
// Swagger UI //
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
// Roles-Guard //
import { RolesGuard } from '../global/guards/role.guard';
import { Roles } from '../global/guards/roles.decorator';
import { UserRoles } from '../user-roles';
// DTos //
import { GetTimerDto } from './dto/getTimer.dto';
import { AddTimerDto } from './dto/addTimer.dto';

@Controller('timers')
@ApiTags('Timers (Play Time)')
@UseGuards(RolesGuard)
export class TimersController {
  constructor(private readonly timersService: TimersService) {}

  @Get()
  @ApiOperation({ summary: 'Get Timer Info' })
  @ApiResponse({
    status: 200,
    description: 'Returns Info Of Timer',
    type: Object,
  })
  @Roles(UserRoles.user)
  async getTimer(@Query() data: GetTimerDto, @Request() req: any) {
    return await this.timersService.getTimer(data.type, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Start-Stop Timer' })
  @ApiResponse({
    status: 201,
    description: 'Returns Success Message',
    type: Object,
  })
  @Roles(UserRoles.user)
  async changeActive(@Query() data: GetTimerDto, @Request() req: any) {
    return await this.timersService.changeActive(data.type, req.user.id);
  }

  @Put()
  @ApiOperation({ summary: 'Add Minutes To Timer' })
  @ApiResponse({
    status: 202,
    description: 'Returns Success Message',
    type: Object,
  })
  @Roles(UserRoles.user)
  async addMinutesTimer(@Query() data: AddTimerDto, @Request() req: any) {
    return await this.timersService.addMinutesTimer(
      data.type,
      data.time,
      req.user.id,
    );
  }
}
