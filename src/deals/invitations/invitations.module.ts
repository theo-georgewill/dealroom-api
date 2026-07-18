import { Module } from '@nestjs/common';

import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';

import { MailModule } from '../../mail/mail.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    MailModule,
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule {}