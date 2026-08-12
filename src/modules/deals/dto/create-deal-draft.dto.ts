import { ApiPropertyOptional } from '@nestjs/swagger';
import { ParticipantRole } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateDealDraftDto {
  @ApiPropertyOptional({
    example: 'Lekki Apartment Purchase',
  })
  @IsOptional()
  @IsString()
  title?: string;


  @ApiPropertyOptional({
    description: 'Existing property to associate with the draft.',
  })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsEnum(ParticipantRole)
  creatorRole?: ParticipantRole;
}