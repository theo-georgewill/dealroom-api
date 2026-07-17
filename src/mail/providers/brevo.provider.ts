import { 
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrevoClient } from '@getbrevo/brevo';

import { SendEmailVerificationMailDto } from '../dto/send-email-verification-mail.dto';
import { SendInvitationMailDto } from '../dto/send-invitation-mail.dto';
import { SendPasswordResetMailDto } from '../dto/send-password-reset-mail.dto';
import { MailProvider } from '../interfaces/mail-provider.interface';
import { invitationTemplate } from '../templates/invitation';


@Injectable()
export class BrevoProvider implements MailProvider {
  private readonly brevo: BrevoClient;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.brevo = new BrevoClient({
      apiKey: this.configService.getOrThrow<string>(
        'BREVO_API_KEY',
      ),
    });
  }

  private readonly logger = new Logger(
    BrevoProvider.name,
  );

  async sendInvitation(
    dto: SendInvitationMailDto,
  ): Promise<void> {
    try {
      await this.brevo.transactionalEmails.sendTransacEmail({
        sender: {
          email: this.configService.getOrThrow<string>(
            'BREVO_SENDER_EMAIL',
          ),
          name:
            this.configService.get<string>(
              'BREVO_SENDER_NAME',
            ) ?? 'DealRoom',
        },
        to: [
          {
            email: dto.to,
          },
        ],
        subject: `${dto.inviterName} invited you to collaborate on ${dto.dealTitle}`,
        htmlContent: invitationTemplate(dto),
        textContent: `${dto.inviterName} has invited you to join the deal ${dto.dealTitle}. Accept the invitation: ${dto.invitationUrl}`,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send invitation email to ${dto.to}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException(
        'Unable to send invitation email',
      );
    }
  }

  async sendPasswordReset(
    dto: SendPasswordResetMailDto,
  ): Promise<void> {
    throw new Error('Not implemented.');
  }

  async sendEmailVerification(
    dto: SendEmailVerificationMailDto,
  ): Promise<void> {
    throw new Error('Not implemented.');
  }
}