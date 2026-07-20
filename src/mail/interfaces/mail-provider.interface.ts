import { SendEmailVerificationMailDto } from '../dto/send-email-verification-mail.dto';
import { SendInvitationMailDto } from '../dto/send-invitation-mail.dto';
import { SendPasswordResetMailDto } from '../dto/send-password-reset-mail.dto';

export interface MailProvider {
  sendInvitation(dto: SendInvitationMailDto): Promise<void>;

  sendPasswordReset(dto: SendPasswordResetMailDto): Promise<void>;

  sendEmailVerification(dto: SendEmailVerificationMailDto): Promise<void>;
}
