import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class NumberValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'param' && metadata.data === 'id') {
      const numericValue = Number(value);
      if (isNaN(numericValue)) {
        throw new BadRequestException('Invalid number parameter!');
      }
      return numericValue;
    }
    return value;
  }
}
