import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateBankAccountDto {
  @ApiProperty({
    example: '044',
  })
  @IsString()
  bankCode!: string;

  @ApiProperty({
    example: '0123456789',
  })
  @IsString()
  @Length(10, 10)
  accountNumber!: string;
}