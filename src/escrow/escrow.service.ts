import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreateEscrowDto } from './dto/create-escrow.dto';

@Injectable()
export class EscrowService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    dealId: string,
    userId: string,
    dto: CreateEscrowDto,
  ) {
    const deal = await this.prisma.deal.findUnique({
      where: {
        id: dealId,
      },
      include: {
        escrow: true,
      },
    });

    if (!deal) {
      throw new NotFoundException(
        'Deal not found',
      );
    }

    if (deal.creatorId !== userId) {
      throw new ForbiddenException(
        'Only the deal creator can create escrow',
      );
    }

    if (deal.escrow) {
      throw new BadRequestException(
        'Escrow already exists',
      );
    }

    const escrow = await this.prisma.escrow.create({
      data: {
        dealId,
        amount: new Prisma.Decimal(dto.amount),
      },
    });

    return {
      success: true,
      message: 'Escrow created successfully',
      data: escrow,
    };
  }

  async findByDeal(
    dealId: string,
    userId: string,
  ) {
    const participant =
      await this.prisma.dealParticipant.findFirst({
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
      throw new NotFoundException(
        'Escrow not found',
      );
    }

    return {
      success: true,
      data: escrow,
    };
  }
}