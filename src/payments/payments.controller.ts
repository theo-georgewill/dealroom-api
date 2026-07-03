import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';

import { PaymentsService } from './payments.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { NombaWebhookDto } from './dto/nomba-webhook.dto';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('initialize')
  initialize(
    @CurrentUser() user: any,
    @Body() dto: InitializePaymentDto,
  ) {
    return this.paymentsService.initialize(
      user.id,
      dto,
    );
  }

  @Post('webhook')
  webhook(
    @Body() payload: NombaWebhookDto,
  ) {
    return this.paymentsService.webhook(
      payload,
    );
  }
}