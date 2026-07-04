import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { DealsModule } from './deals/deals.module';
import { InvitationsModule } from './invitations/invitations.module';
import { EscrowModule } from './escrow/escrow.module';
import { PaymentsModule } from './payments/payments.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
      ConfigModule.forRoot({
        isGlobal: true,
      }),
    AuthModule, 
    UsersModule, 
    PrismaModule, 
    DealsModule, 
    InvitationsModule, 
    EscrowModule, 
    PaymentsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
