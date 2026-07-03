import {
  IsEmail,
  IsEnum,
} from 'class-validator';

import { ParticipantRole } from '@prisma/client';

export class CreateInvitationDto {
  @IsEmail()
  email!: string;

  @IsEnum(ParticipantRole)
  role!: ParticipantRole;
}