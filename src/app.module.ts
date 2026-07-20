import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { DealsModule } from './deals/deals.module';
import { InvitationsModule } from './deals/invitations/invitations.module';
import { EscrowModule } from './deals/escrow/escrow.module';
import { PaymentsModule } from './payments/payments.module';
import { HealthController } from './health/health.controller';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';
import { StorageModule } from './storage/storage.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 100,
      },
    ]),
    AuthModule, 
    UsersModule, 
    PrismaModule, 
    DealsModule, 
    InvitationsModule, 
    EscrowModule, 
    PaymentsModule, 
    BankAccountsModule, 
    StorageModule, MailModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
