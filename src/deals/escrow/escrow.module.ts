import { Module } from '@nestjs/common';
import { EscrowController } from './escrow.controller';
import { EscrowService } from './escrow.service';
import { PaymentsModule } from '../../payments/payments.module';

@Module({
  imports: [PaymentsModule],
  controllers: [EscrowController],
  providers: [EscrowService]
})
export class EscrowModule {}
