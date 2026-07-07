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
          reference,
          creatorId: userId,

          property: {
            create: {
              name: dto.property.name,
              type: dto.property.type,
              address: dto.property.address,
              city: dto.property.city,
              state: dto.property.state,
              country: dto.property.country,
              description: dto.property.description,
              images: dto.property.images
                ? (dto.property.images as unknown as Prisma.InputJsonValue)
                : Prisma.JsonNull,
            },
          },

          terms: {
            create: {
              dealType: dto.terms.dealType,
              currency: dto.terms.currency,
              dealValue: new Prisma.Decimal(dto.terms.dealValue),
              earnestMoney:
                dto.terms.earnestMoney !== undefined
                  ? new Prisma.Decimal(dto.terms.earnestMoney)
                  : null,
              closingDate: new Date(dto.terms.closingDate),
              longStopDate: dto.terms.longStopDate
                ? new Date(dto.terms.longStopDate)
                : null,
              paymentStructure: dto.terms.paymentStructure,
            },
          },

          escrow: {
            create: {
              amount: new Prisma.Decimal(dto.escrow.amount),
              fundingSource: dto.escrow.fundingSource,
              holdingPeriod: dto.escrow.holdingPeriod,
              currency: dto.terms.currency,

              releaseConditions: {
                create: dto.escrow.releaseConditions.map(
                  (description, index) => ({
                    description,
                    sortOrder: index + 1,
                  }),
                ),
              },
            },
          },
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

      await tx.invitation.createMany({
        data: dto.stakeholders.map((stakeholder) => ({
          dealId: deal.id,
          email: stakeholder.email,
          role: stakeholder.role,
          invitedById: userId,
          token: randomUUID(),
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ),
        })),
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
          property: true,
          terms: true,
          escrow: {
            include: {
              releaseConditions: true,
              payments: true,
              transactions: true,
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
          invitations: true,
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
        property: true,
        terms: true,
        escrow: {
          include: {
            releaseConditions: true,
            payments: true,
            transactions: true,
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

        property: true,

        terms: true,

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
            releaseConditions: true,
            payments: true,
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
      }
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

    return this.prisma.$transaction(async (tx) => {
      await tx.deal.update({
        where: { id },
        data: {
          title: dto.title,
        },
      });

      if (dto.property) {
        await tx.property.update({
          where: {
            dealId: id,
          },
          data: {
            name: dto.property.name,
            type: dto.property.type,
            address: dto.property.address,
            city: dto.property.city,
            state: dto.property.state,
            country: dto.property.country,
            description: dto.property.description,
            images: dto.property.images
              ? (dto.property.images as unknown as Prisma.InputJsonValue)
              : Prisma.JsonNull,
          },
        });
      }

      if (dto.terms) {
        await tx.dealTerms.update({
          where: {
            dealId: id,
          },
          data: {
            dealType: dto.terms.dealType,
            currency: dto.terms.currency,
            dealValue:
              dto.terms.dealValue !== undefined
                ? new Prisma.Decimal(dto.terms.dealValue)
                : undefined,
            earnestMoney:
              dto.terms.earnestMoney !== undefined
                ? new Prisma.Decimal(dto.terms.earnestMoney)
                : undefined,
            closingDate: dto.terms.closingDate
              ? new Date(dto.terms.closingDate)
              : undefined,
            longStopDate: dto.terms.longStopDate
              ? new Date(dto.terms.longStopDate)
              : undefined,
            paymentStructure: dto.terms.paymentStructure,
          },
        });
      }

      if (dto.escrow) {
        await tx.escrow.update({
          where: {
            dealId: id,
          },
          data: {
            amount:
              dto.escrow.amount !== undefined
                ? new Prisma.Decimal(dto.escrow.amount)
                : undefined,
            fundingSource: dto.escrow.fundingSource,
            holdingPeriod: dto.escrow.holdingPeriod,
          },
        });

        if (dto.escrow.releaseConditions) {
          const escrow = await tx.escrow.findUnique({
            where: {
              dealId: id,
            },
          });

          await tx.escrowReleaseCondition.deleteMany({
            where: {
              escrowId: escrow!.id,
            },
          });

          await tx.escrowReleaseCondition.createMany({
            data: dto.escrow.releaseConditions.map(
              (description, index) => ({
                escrowId: escrow!.id,
                description,
                sortOrder: index + 1,
              }),
            ),
          });
        }
      }

      const updatedDeal = await tx.deal.findUnique({
        where: {
          id,
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
          property: true,
          terms: true,
          escrow: {
            include: {
              releaseConditions: true,
              payments: true,
              transactions: true,
            },
          },
          participants: {
            include: {
              user: true,
            },
          },
          invitations: true,
        },
      });

      return {
        success: true,
        message: 'Deal updated successfully',
        data: updatedDeal,
      };
    });
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