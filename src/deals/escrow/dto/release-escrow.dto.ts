import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class ReleaseEscrowDto {
  @ApiProperty({
    example: 'cmev4b9jq0000t6p3n4d7q8r2',
    description: 'Recipient bank account ID.',
  })
  @IsString()
  bankAccountId!: string;
}
