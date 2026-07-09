import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { NombaService } from './nomba/nomba.service';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    HttpModule,
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    NombaService,
  ],
  exports: [
    PaymentsService,
    NombaService,
  ],
})
export class PaymentsModule {}