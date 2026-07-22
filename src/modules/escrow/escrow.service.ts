import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';

import { PrismaService } from '../../core/prisma/prisma.service';

import { PAYMENT_PROVIDER } from '../../integrations/payments/constants/payment.constants';
import type { PaymentProvider } from '../../integrations/payments/interfaces/payment-provider.interface';

import { ReleaseEscrowDto } from './dto/release-escrow.dto';

@Injectable()
export class EscrowService {
  constructor(
    private readonly prisma: PrismaService,

    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: PaymentProvider,
  ) {}

  async findByDeal(dealId: string, userId: string) {
    const participant = await this.prisma.dealParticipant.findFirst({
      where: {
        dealId,
        userId,
      },
    });

    if (!participant) {
      throw new ForbiddenException();
    }

    const escrow = await this.prisma.escrow.findUnique({
      where: {
        dealId,
      },
      include: {
        transactions: true,
      },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    return {
      success: true,
      data: escrow,
    };
  }

  async release(dealId: string, userId: string, dto: ReleaseEscrowDto) {
    const buyer = await this.prisma.dealParticipant.findFirst({
      where: {
        dealId,
        userId,
        role: 'BUYER',
        status: 'ACCEPTED',
      },
    });

    if (!buyer) {
      throw new ForbiddenException('Only the buyer can release escrow');
    }

    const escrow = await this.prisma.escrow.findUnique({
      where: {
        dealId,
      },
      include: {
        deal: {
          include: {
            participants: {
              where: {
                role: 'SELLER',
                status: 'ACCEPTED',
              },
            },
          },
        },
      },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    if (escrow.status !== 'FUNDED') {
      throw new BadRequestException('Escrow is not fully funded');
    }

    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: {
        id: dto.bankAccountId,
        //userId: seller.userId,
      },
    });

    if (!bankAccount) {
      throw new NotFoundException('Bank account not found');
    }

    const merchantTxRef = `release_${crypto.randomUUID()}`;

    const transfer = await this.paymentProvider.createTransfer({
      amount: Number(escrow.amount),
      bankCode: bankAccount.bankCode,
      accountNumber: bankAccount.accountNumber,
      accountName: bankAccount.accountName,
      senderName: 'DealRoom',
      narration: `Escrow release ${dealId}`,
      merchantTxRef,
    });

    await this.prisma.transfer.create({
      data: {
        escrowId: escrow.id,
        merchantTxRef,
        providerReference: transfer.transactionId ?? null,
        bankCode: bankAccount.bankCode,
        accountNumber: bankAccount.accountNumber,
        accountName: bankAccount.accountName,
        amount: escrow.amount,
        currency: escrow.currency,
        status: 'PROCESSING',
      },
    });

    await this.prisma.escrow.update({
      where: {
        id: escrow.id,
      },
      data: {
        status: 'RELEASING',
      },
    });

    await this.prisma.deal.update({
      where: {
        id: escrow.dealId,
      },
      data: {
        status: 'RELEASE_REQUESTED',
      },
    });

    return {
      success: true,
      message: 'Transfer initiated successfully',
      data: {
        merchantTxRef,
        transfer,
      },
    };
  }
}
