import { Inject, Injectable } from '@nestjs/common';

import { SendEmailVerificationMailDto } from './dto/send-email-verification-mail.dto';
import { SendInvitationMailDto } from './dto/send-invitation-mail.dto';
import { SendPasswordResetMailDto } from './dto/send-password-reset-mail.dto';
import type { MailProvider } from './interfaces/mail-provider.interface';

@Injectable()
export class MailService {
  constructor(
    @Inject('MAIL_PROVIDER')
    private readonly provider: MailProvider,
  ) {}

  async sendInvitation(dto: SendInvitationMailDto): Promise<void> {
    await this.provider.sendInvitation(dto);
  }

  async sendPasswordReset(dto: SendPasswordResetMailDto): Promise<void> {
    await this.provider.sendPasswordReset(dto);
  }

  async sendEmailVerification(
    dto: SendEmailVerificationMailDto,
  ): Promise<void> {
    await this.provider.sendEmailVerification(dto);
  }
}
