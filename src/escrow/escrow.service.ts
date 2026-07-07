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