import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ReleaseEscrowDto {
  @ApiProperty({
    example: 'cmev4b9jq0000t6p3n4d7q8r2',
    description: 'Recipient bank account ID.',
  })
  @IsString()
  bankAccountId!: string;
}
