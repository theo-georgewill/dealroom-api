import * as crypto from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NombaService } from './nomba/nomba.service';
import { NombaWebhookDto } from './dto/nomba-webhook.dto';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nomba: NombaService,
    private readonly configService: ConfigService,
  ) {}

  private verifyWebhookSignature(
    signature: string,
    payload: NombaWebhookDto,
  ): void {
    const expected = crypto
      .createHmac(
        'sha256',
        this.configService.getOrThrow<string>(
          'NOMBA_WEBHOOK_SECRET',
        ),
      )
      .update(JSON.stringify(payload))
      .digest('hex');

    if (signature !== expected) {
      throw new UnauthorizedException(
        'Invalid webhook signature',
      );
    }
  }
  
  async initialize(
    userId: string,
    dto: InitializePaymentDto,
  ) {
    const escrow =
      await this.prisma.escrow.findUnique({
        where: {
          id: dto.escrowId,
        },
        include: {
          deal: {
            include: {
              participants: true,
            },
          },
        },
      });

    if (!escrow) {
      throw new NotFoundException(
        'Escrow not found',
      );
    }

    const participant =
      escrow.deal.participants.find(
        (p) =>
          p.userId === userId &&
          p.role === 'BUYER',
      );

    if (!participant) {
      throw new ForbiddenException(
        'Only the buyer can fund this escrow',
      );
    }

    if (escrow.status === 'FUNDED') {
      throw new BadRequestException(
        'Escrow has already been fully funded',
      );
    }

    if (
      Number(dto.amount) +
        Number(escrow.fundedAmount) >
      Number(escrow.amount)
    ) {
      throw new BadRequestException(
        'Funding exceeds escrow amount',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        email: true,
      },
    });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    const merchantTxRef = `pay_${crypto.randomUUID()}`;

    const payment =
      await this.nomba.createCheckoutOrder({
        amount: dto.amount*100, //remember to remove
        orderReference: merchantTxRef,
        customerEmail: user.email,
      });

    await this.prisma.payment.create({
      data: {
        escrowId: escrow.id,
        merchantTxRef,
        checkoutReference: payment.orderReference,
        providerReference: null,
        amount: new Prisma.Decimal(dto.amount),
        currency: 'NGN',
        status: 'PENDING',
      },
    });

    return {
      success: true,
      message: 'Checkout initialized',
      data: {
        checkoutUrl: 
          payment.checkoutLink,
        orderReference:
          payment.orderReference,
      },
    };
  }

  async webhook(
    signature: string,
    payload: NombaWebhookDto,
  ) {
    this.verifyWebhookSignature(
      signature, 
      payload
    );

    const existing =
      await this.prisma.webhookEvent.findUnique({
        where: {
          requestId: payload.requestId,
        },
      });

    if (existing) {
      return {
        success: true,
        message: 'Webhook already processed',
      };
    }

    const paymentRecord =
      await this.prisma.payment.findUnique({
        where: {
          merchantTxRef:
            payload.data.transaction.merchantTxRef,
        },
        include: {
          escrow: true,
        },
      });

    if (!paymentRecord) {
      throw new NotFoundException(
        'Payment not found',
      );
    }

    if (payload.event_type !== 'payment_success') {
      return {
        success: true,
        message: 'Event ignored',
      };
    }

    const rawPayload = JSON.parse(
      JSON.stringify(instanceToPlain(payload)),
    ) as Prisma.InputJsonValue;

    return this.prisma.$transaction(async (tx) => {
      await tx.webhookEvent.create({
        data: {
          requestId: payload.requestId,
          eventType: payload.event_type,
          signature,
          payload: rawPayload,
        },
      });

      await tx.payment.update({
        where: {
          id: paymentRecord.id,
        },
        data: {
          status: 'SUCCESS',
          paidAt: new Date(),
        },
      });

      await tx.escrowTransaction.create({
        data: {
          escrowId: paymentRecord.escrowId,
          ledgerReference: paymentRecord.merchantTxRef,
          providerReference: paymentRecord.providerReference,
          amount: new Prisma.Decimal(
            payload.data.transaction.transactionAmount,
          ),
          currency: paymentRecord.currency,
          type: 'DEPOSIT',
          status: 'SUCCESS',
          webhookPayload: rawPayload,
        },
      });
      const escrow = await tx.escrow.update({
        where: {
          id: paymentRecord.escrowId,
        },
        data: {
          fundedAmount: {
            increment: new Prisma.Decimal(
              payload.data.transaction.transactionAmount
            ),
          },
        },
      });

      const funded = Number(
        escrow.fundedAmount,
      );

      const status =
        funded >= Number(escrow.amount)
          ? 'FUNDED'
          : 'PARTIALLY_FUNDED';

      await tx.escrow.update({
        where: {
          id: escrow.id,
        },
        data: {
          status,
          fundedAt:
            status === 'FUNDED'
              ? new Date()
              : null,
        },
      });

      if (status === 'FUNDED') {
        await tx.deal.update({
          where: {
            id: escrow.dealId,
          },
          data: {
            status: 'FUNDED',
          },
        });
      }

      return {
        success: true,
        message: 'Webhook processed',
      };
    });
  }
}