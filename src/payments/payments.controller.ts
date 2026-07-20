import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Get,
  Query,
  Res,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { NombaWebhookDto } from './dto/nomba-webhook.dto';

@ApiTags('Payments')
@Controller({
  path: 'payments',
  version: '1',
})
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initialize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Initialize a payment',
    description:
      'Initializes a payment transaction for the authenticated user and returns the information required to complete payment through Nomba.',
  })
  @ApiBody({
    type: InitializePaymentDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Payment initialized successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid payment request.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  initialize(@CurrentUser() user: any, @Body() dto: InitializePaymentDto) {
    return this.paymentsService.initialize(user.id, dto);
  }

  @Get('nomba/callback')
  callback(
    @Query('orderReference') orderReference: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/deals/create/success?orderReference=${orderReference}`,
    );
  }

  @Post('webhook')
  @ApiOperation({
    summary: 'Receive Nomba webhook',
    description:
      'Receives payment event notifications from Nomba and updates the payment and escrow status accordingly.',
  })
  @ApiBody({
    type: NombaWebhookDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid webhook payload.',
  })
  @HttpCode(200)
  async webhook(
    @Headers('nomba-signature') signature: string,
    @Headers('nomba-timestamp') timestamp: string,
    @Body() payload: NombaWebhookDto,
  ) {
    this.logger.log(`Signature: ${signature}`);
    this.logger.log(`Timestamp: ${timestamp}`);
    this.logger.log('Webhook received');

    this.logger.debug(JSON.stringify(payload, null, 2));
    return this.paymentsService.webhook(signature, timestamp, payload);
  }
}
