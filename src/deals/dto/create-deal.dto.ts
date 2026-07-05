import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class CreateDealDto {
  @ApiProperty({
    example: 'Purchase of 3-Bedroom Duplex',
    description: 'A short title describing the deal.',
  })
  @IsString()
  title!: string;

  @ApiPropertyOptional({
    example: 'Buyer is purchasing a newly built 3-bedroom duplex in Lekki.',
    description: 'Additional information about the deal.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '12 Admiralty Way, Lekki Phase 1, Lagos',
    description: 'The address of the property involved in the deal.',
  })
  @IsString()
  propertyAddress!: string;

  @ApiProperty({
    example: 'Residential',
    description: 'The type of property involved in the deal.',
  })
  @IsString()
  propertyType!: string;

  @ApiProperty({
    example: 85000000,
    description: 'The total value of the deal in the specified currency.',
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  dealValue!: number;

  @ApiPropertyOptional({
    example: 'NGN',
    description: 'The currency of the deal value.',
    default: 'NGN',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    example: '2026-12-31',
    description: 'The expected closing date of the deal (ISO 8601 format).',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  closingDate?: string;
}