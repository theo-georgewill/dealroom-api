import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CompleteUploadDto } from '../../../integrations/storage/dto/complete-upload.dto';

export class CompletePropertyUploadDto extends CompleteUploadDto {
  @ApiProperty({
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isCover?: boolean;
}