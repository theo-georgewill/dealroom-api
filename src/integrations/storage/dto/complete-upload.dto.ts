import { 
  IsMimeType, 
  IsNumber, 
  IsPositive, 
  IsString
} from 'class-validator';

export class CompleteUploadDto {

  @IsString()
  key!: string;

  @IsString()
  originalName!: string;

  @IsMimeType()
  mimeType!: string;

  @IsNumber()
  @IsPositive()
  size!: number;
}
