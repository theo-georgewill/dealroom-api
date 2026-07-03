import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDealDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  propertyAddress!: string;

  @IsString()
  propertyType!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  dealValue!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString()
  closingDate?: string;
}