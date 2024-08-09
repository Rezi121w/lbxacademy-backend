import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '🟦🔹LBX-Academy Backend Presents LBX-Academy💠🔚';
  }
}
