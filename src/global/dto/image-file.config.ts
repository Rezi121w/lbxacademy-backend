import { HttpStatus, ParseFilePipeBuilder } from '@nestjs/common';

export function ImageFileConfig(isRequired?: boolean) {
  return new ParseFilePipeBuilder()
    .addFileTypeValidator({
      fileType: /(jpg|jpeg|png|gif|webp)$/,
    })
    .addMaxSizeValidator({
      maxSize: 1024 * 1024 * 5.5, // 5.5 MB
    })
    .build({
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      fileIsRequired: isRequired != undefined ? isRequired : true,
    });
}
