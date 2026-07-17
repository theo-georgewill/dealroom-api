import { ParticipantRole } from "@prisma/client";
export class SendInvitationMailDto {
  to!: string;
  inviterName!: string;
  dealTitle!: string;
  role!: ParticipantRole;
  invitationUrl!: string;
  expiresAt!: Date;
}