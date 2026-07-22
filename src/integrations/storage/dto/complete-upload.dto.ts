import { IsMimeType, IsNumber, IsString } from 'class-validator';

export class CompleteUploadDto {
  @IsString()
  dealId!: string;

  @IsString()
  key!: string;

  @IsString()
  originalName!: string;

  @IsMimeType()
  contentType!: string;

  @IsNumber()
  size!: number;
}
