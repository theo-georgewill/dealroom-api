import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { PAYMENT_PROVIDER } from './constants/payment.constants';
import { NombaProvider } from './providers/nomba.provider';

@Module({
  imports: [HttpModule],
  providers: [
    {
      provide: PAYMENT_PROVIDER,
      useClass: NombaProvider,
    },
  ],
  exports: [PAYMENT_PROVIDER],
})
export class PaymentIntegrationModule {}
