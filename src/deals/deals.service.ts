import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';

@Injectable()
export class DealsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    userId: string,
    dto: CreateDealDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const reference = await this.generateReference(tx);

      const deal = await tx.deal.create({
        data: {
          title: dto.title,
          description: dto.description,
          propertyAddress: dto.propertyAddress,
          propertyType: dto.propertyType,
          dealValue: new Prisma.Decimal(dto.dealValue),
          currency: dto.currency ?? 'NGN',
          closingDate: dto.closingDate
            ? new Date(dto.closingDate)
            : null,
          reference,
          creatorId: userId,
        },
      });

      await tx.dealParticipant.create({
        data: {
          dealId: deal.id,
          userId,
          role: 'BUYER',
          status: 'ACCEPTED',
          joinedAt: new Date(),
        },
      });

      const createdDeal = await tx.deal.findUnique({
        where: {
          id: deal.id,
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      return {
        success: true,
        message: 'Deal created successfully',
        data: createdDeal,
      };
    });
  }

  async findAll(userId: string) {
    const deals = await this.prisma.deal.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        participants: true,
        escrow: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      message: 'Deals retrieved successfully',
      data: deals,
    };
  }

  async findOne(
    id: string,
    userId: string,
  ) {
    const deal = await this.prisma.deal.findFirst({
      where: {
        id,
        participants: {
          some: {
            userId,
          },
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        escrow: {
          include: {
            transactions: true,
          },
        },
        invitations: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            expiresAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    return {
      success: true,
      message: 'Deal retrieved successfully',
      data: deal,
    };
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateDealDto,
  ) {
    const deal = await this.prisma.deal.findUnique({
      where: {
        id,
      },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    if (deal.creatorId !== userId) {
      throw new ForbiddenException(
        'Only the deal creator can update this deal',
      );
    }

    if (
      deal.status === 'FUNDED' ||
      deal.status === 'COMPLETED'
    ) {
      throw new ForbiddenException(
        'This deal can no longer be modified',
      );
    }

    const updatedDeal = await this.prisma.deal.update({
      where: {
        id,
      },
      data: {
        title: dto.title,
        description: dto.description,
        propertyAddress: dto.propertyAddress,
        propertyType: dto.propertyType,
        currency: dto.currency,
        closingDate: dto.closingDate
          ? new Date(dto.closingDate)
          : undefined,
        dealValue:
          dto.dealValue !== undefined
            ? new Prisma.Decimal(dto.dealValue)
            : undefined,
      },
    });

    return {
      success: true,
      message: 'Deal updated successfully',
      data: updatedDeal,
    };
  }

  async remove(
    id: string,
    userId: string,
  ) {
    const deal = await this.prisma.deal.findUnique({
      where: {
        id,
      },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    if (deal.creatorId !== userId) {
      throw new ForbiddenException(
        'Only the deal creator can delete this deal',
      );
    }

    if (
      deal.status === 'FUNDED' ||
      deal.status === 'COMPLETED'
    ) {
      throw new ForbiddenException(
        'This deal can no longer be deleted',
      );
    }

    await this.prisma.deal.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
      message: 'Deal deleted successfully',
    };
  }

  private async generateReference(
    tx: Prisma.TransactionClient,
  ) {
    while (true) {
      const reference = `DLR-${randomUUID()
        .replace(/-/g, '')
        .slice(0, 10)
        .toUpperCase()}`;

      const exists = await tx.deal.findUnique({
        where: {
          reference,
        },
      });

      if (!exists) {
        return reference;
      }
    }
  }
}