import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  Min,
} from 'class-validator';

export class ReleaseEscrowDto {
  @ApiProperty({
    example: 25000000,
    description:
      'The amount to release from escrow to the recipient.',
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount!: number;
}