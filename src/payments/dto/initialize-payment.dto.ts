import {
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

import { Type } from 'class-transformer';

export class InitializePaymentDto {
  @IsString()
  escrowId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount!: number;
}