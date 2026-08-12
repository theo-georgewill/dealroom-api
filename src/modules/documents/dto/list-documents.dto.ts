import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

import {
  DocumentStatus,
  DocumentType,
} from '@prisma/client';

export class ListDocumentsDto {
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;
}