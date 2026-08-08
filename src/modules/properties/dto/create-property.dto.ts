import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PropertyType } from '@prisma/client';

export class CreatePropertyDto {
  @ApiProperty({
    example: '4 Bedroom Detached Duplex',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    enum: PropertyType,
  })
  @IsEnum(PropertyType)
  type!: PropertyType;

  @ApiProperty({
    example: '12 Admiralty Way',
  })
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
}