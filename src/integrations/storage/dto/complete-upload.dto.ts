import { IsMimeType, IsNumber, IsString } from 'class-validator';

export class CompleteUploadDto {

  @IsString()
  key!: string;

  @IsString()
  originalName!: string;

  @IsMimeType()
  mimeType!: string;

  @IsNumber()
  size!: number;
}
