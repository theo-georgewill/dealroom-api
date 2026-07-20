import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class CreateEscrowDto {
  @ApiProperty({
    example: 85000000,
    description: 'The amount to be held in escrow.',
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount!: number;
}
