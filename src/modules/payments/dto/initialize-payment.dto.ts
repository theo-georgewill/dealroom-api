import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, Min } from 'class-validator';

export class InitializePaymentDto {
  @ApiProperty({
    example: '8d9a4d58-7d2b-4e5d-a24b-5fd7b6b92c5c',
    description: 'The unique identifier of the escrow to be funded.',
  })
  @IsString()
  escrowId!: string;

  @ApiProperty({
    example: 50000000,
    description: 'The amount to fund the escrow with.',
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount!: number;
}
