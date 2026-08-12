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
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  Currency,
  DealType,
  FundingSource,
  ParticipantRole,
  PaymentStructure,
} from '@prisma/client';


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

  @ApiProperty({
    description: 'The ID of the existing property associated with this deal.',
    example: 'cmf2p3abc0000xyz123456789',
  })
  @IsString()
  @IsNotEmpty()
  propertyId!: string;

  @ApiProperty({
    enum: ParticipantRole,
    description: 'The role of the authenticated user in this deal.',
    example: ParticipantRole.SELLER,
  })
  @IsEnum(ParticipantRole)
  creatorRole!: ParticipantRole;
  
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
