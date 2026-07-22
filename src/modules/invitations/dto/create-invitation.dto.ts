import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum } from 'class-validator';

import { ParticipantRole } from '@prisma/client';

export class CreateInvitationDto {
  @ApiProperty({
    example: 'jane.doe@example.com',
    description: 'The email address of the user being invited to the deal.',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    enum: ParticipantRole,
    example: ParticipantRole.BUYER,
    description: 'The role assigned to the invited participant.',
  })
  @IsEnum(ParticipantRole)
  role!: ParticipantRole;
}
