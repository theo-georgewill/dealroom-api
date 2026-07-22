import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class LookupBankAccountDto {
  @ApiProperty({
    example: '044',
    description: 'NUBAN bank code',
  })
  @IsString()
  bankCode!: string;

  @ApiProperty({
    example: '0123456789',
    description: '10-digit account number',
  })
  @IsString()
  @Length(10, 10)
  accountNumber!: string;
}
