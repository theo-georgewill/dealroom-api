import { IsMimeType, IsNumber, IsString } from 'class-validator';

export class CreateUploadUrlDto {
  @IsString()
  dealId!: string;

  @IsString()
  filename!: string;

  @IsMimeType()
  contentType!: string;

  @IsNumber()
  size!: number;
}
