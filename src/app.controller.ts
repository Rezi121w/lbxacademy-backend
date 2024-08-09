import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
// Swagger UI //
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller()
@ApiTags('/')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'GET Hello Text' })
  @ApiResponse({ status: 200, description: 'Returns Hello Text', type: String })
  getHello(): string {
    return this.appService.getHello();
  }
}
