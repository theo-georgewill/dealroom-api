import { ApiProperty } from '@nestjs/swagger';
import { IsMimeType, IsString } from 'class-validator';

export class CreatePropertyUploadUrlDto {
  @ApiProperty({
    example: 'house-front.jpg',
  })
  @IsString()
  filename!: string;

  @ApiProperty({
    example: 'image/jpeg',
  })
  @IsMimeType()
  mimeType!: string;
}