import { Type } from 'class-transformer';
import {
  IsArray,
  ArrayMinSize,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  Currency,
  DealType,
  FundingSource,
  ParticipantRole,
  PaymentStructure,
  PropertyType,
} from '@prisma/client';

class PropertyImageDto {
  @ApiProperty({
    example: 'properties/deal_123/front.webp',
  })
  @IsString()
  key!: string;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

class CreatePropertyDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ enum: PropertyType })
  @IsEnum(PropertyType)
  type!: PropertyType;

  @ApiProperty()
  @IsString()
  address!: string;

  @ApiProperty()
  @IsString()
  city!: string;

  @ApiProperty()
  @IsString()
  state!: string;

  @ApiProperty()
  @IsString()
  country!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    type: [PropertyImageDto],
    description: 'Object storage metadata for uploaded images.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropertyImageDto)
  images?: PropertyImageDto[];
}

class CreateDealTermsDto {
  @ApiProperty({ enum: DealType })
  @IsEnum(DealType)
  dealType!: DealType;

  @ApiProperty({ enum: Currency })
  @IsEnum(Currency)
  currency!: Currency;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  dealValue!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  earnestMoney?: number;

  @ApiProperty()
  @IsDateString()
  closingDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  longStopDate?: string;

  @ApiProperty({ enum: PaymentStructure })
  @IsEnum(PaymentStructure)
  paymentStructure!: PaymentStructure;
}

class CreateEscrowDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty({ enum: FundingSource })
  @IsEnum(FundingSource)
  fundingSource!: FundingSource;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  holdingPeriod!: number;

  @ApiProperty({
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  releaseConditions!: string[];
}

class CreateParticipantDto {
  @ApiProperty({ enum: ParticipantRole })
  @IsEnum(ParticipantRole)
  role!: ParticipantRole;

  @ApiProperty()
  @IsString()
  fullName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;
}

export class CreateDealDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => CreatePropertyDto)
  property!: CreatePropertyDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => CreateDealTermsDto)
  terms!: CreateDealTermsDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => CreateEscrowDto)
  escrow!: CreateEscrowDto;

  @ApiProperty({
    type: [CreateParticipantDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateParticipantDto)
  stakeholders!: CreateParticipantDto[];
}