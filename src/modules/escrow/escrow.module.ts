import { Module } from '@nestjs/common';
import { EscrowController } from './escrow.controller';
import { EscrowService } from './escrow.service';
import { PaymentsModule } from '../payments/payments.module';
import { PaymentIntegrationModule } from '../../integrations/payments/payment-integration.module';

@Module({
  imports: [PaymentsModule, PaymentIntegrationModule],
  controllers: [EscrowController],
  providers: [EscrowService],
})
export class EscrowModule {}
