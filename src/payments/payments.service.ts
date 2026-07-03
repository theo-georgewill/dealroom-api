import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { NombaService } from './nomba/nomba.service';
import { NombaWebhookDto } from './dto/nomba-webhook.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nomba: NombaService,
  ) {}

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

    const reference = randomUUID();

    const payment =
      await this.nomba.initializePayment({
        amount: dto.amount,
        reference,
        email: user.email,
      });

    await this.prisma.escrowTransaction.create({
      data: {
        escrowId: escrow.id,
        amount: new Prisma.Decimal(dto.amount),
        type: 'DEPOSIT',
        status: 'PENDING',
        reference,
        providerReference:
          payment.data.orderReference,
      },
    });

    return {
      success: true,
      message: 'Checkout initialized',
      data: {
        checkoutUrl: payment.data.checkoutUrl,
        orderReference:
          payment.data.orderReference,
      },
    };
  }

  async webhook(
    payload: NombaWebhookDto,
  ) {
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

    const transaction =
      await this.prisma.escrowTransaction.findFirst({
        where: {
          reference: payload.data.merchantTxRef,
        },
        include: {
          escrow: true,
        },
      });

    if (!transaction) {
      throw new NotFoundException(
        'Transaction not found',
      );
    }

    if (payload.event !== 'payment_success') {
      return {
        success: true,
        message: 'Event ignored',
      };
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.escrowTransaction.update({
        where: {
          id: transaction.id,
        },
        data: {
          status: 'SUCCESS',
        },
      });

      const escrow = await tx.escrow.update({
        where: {
          id: transaction.escrowId,
        },
        data: {
          fundedAmount: {
            increment: new Prisma.Decimal(
              payload.data.amount,
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