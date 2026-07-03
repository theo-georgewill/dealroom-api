import {
  IsNumber,
  Min,
} from 'class-validator';

import { Type } from 'class-transformer';

export class ReleaseEscrowDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount!: number;
}