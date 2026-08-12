import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateDocumentUploadUrlDto {
  @IsString()
  @IsNotEmpty()
  dealId!: string;

  @IsString()
  @IsNotEmpty()
  originalName!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;
}