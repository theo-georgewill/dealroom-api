import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MAIL_PROVIDER } from './mail.constants';
import { MailService } from './mail.service';
import { BrevoProvider } from './providers/brevo.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: MAIL_PROVIDER,
      useClass: BrevoProvider,
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}