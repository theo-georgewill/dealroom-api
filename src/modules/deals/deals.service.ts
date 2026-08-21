import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, DealStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { DealScope, ListDealsDto } from './dto/list-deals.dto';
import { CreateDealDraftDto } from './dto/create-deal-draft.dto';

const dealInclude = {
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
} satisfies Prisma.DealInclude;

@Injectable()
export class DealsService {
  constructor(private readonly prisma: PrismaService) {}

  private calculateProgress(status: DealStatus): number {
    switch (status) {
      case DealStatus.DRAFT:
        return 10;

      case DealStatus.PENDING_PARTICIPANTS:
        return 25;

      case DealStatus.PENDING_FUNDING:
        return 40;

      case DealStatus.FUNDED:
        return 55;

      case DealStatus.DUE_DILIGENCE:
        return 70;

      case DealStatus.RELEASE_REQUESTED:
        return 90;

      case DealStatus.COMPLETED:
        return 100;

      case DealStatus.DISPUTED:
        return 65;

      case DealStatus.CANCELLED:
        return 0;

      default:
        return 0;
    }
  }

  async createDraft(
    userId: string,
    dto: CreateDealDraftDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const reference = await this.generateReference(tx);

      if (dto.propertyId) {
        const property = await tx.property.findFirst({
          where: {
            id: dto.propertyId,
            ownerId: userId,
          },
        });

        if (!property) {
          throw new NotFoundException('Property not found.');
        }
      }

      const deal = await tx.deal.create({
        data: {
          title:
            dto.title ??
            `Draft Deal ${new Date().toISOString()}`,
          reference,
          creatorId: userId,
          status: DealStatus.DRAFT,
          ...(dto.propertyId && {
            propertyId: dto.propertyId,
          }),
        },
      });

      if (dto.creatorRole) {
        await tx.dealParticipant.create({
          data: {
            dealId: deal.id,
            userId,
            role: dto.creatorRole,
            status: 'ACCEPTED',
            joinedAt: new Date(),
          },
        });
      }


      const createdDeal = await tx.deal.findUnique({
        where: {
          id: deal.id,
        },
        include: dealInclude,
      });

      if (!createdDeal) {
        throw new NotFoundException(
          'Failed to load created deal.',
        );
      }

      return {
        success: true,
        message: 'Deal draft created successfully',
        data: {
          ...createdDeal,
          progress: this.calculateProgress(createdDeal.status),
        },
      };
    });
  }

  async create(
    userId: string, 
    dto: CreateDealDto
  ) {
    return this.prisma.$transaction(async (tx) => {
      const reference = await this.generateReference(tx);

      const property = await tx.property.findFirst({
        where: {
          id: dto.propertyId,
          ownerId: userId,
        },
      });

      if (!property) {
        throw new NotFoundException('Property not found.');
      }

      const deal = await tx.deal.create({
        data: {
          title: dto.title,
          reference,
          creatorId: userId,
          propertyId: dto.propertyId,

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
          ...(dto.escrow && {
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
          })
        },
      });

      await tx.dealParticipant.create({
        data: {
          dealId: deal.id,
          userId,
          role: dto.creatorRole,
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
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        })),
      });

      const createdDeal = await tx.deal.findUnique({
        where: {
          id: deal.id,
        },
        include: dealInclude,
      });

      if (!createdDeal ) {
        throw new NotFoundException('Failed to load created deal');
      }

      return {
        success: true,
        message: 'Deal created successfully',
        data: {
          createdDeal: {
            ...createdDeal,
            progress: this.calculateProgress(createdDeal.status),
          },
          payment: {
            escrowId: createdDeal.escrow ? createdDeal.escrow.id : null,
            amount: createdDeal.escrow ? Number(createdDeal.escrow.amount) : null,
            currency: createdDeal.escrow ? createdDeal.escrow.currency : null,
          },
        },
      };
    });
  }

  async findAll(
    userId: string,
    query: ListDealsDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const accessWhere: Prisma.DealWhereInput = {};

    switch (query.scope) {
      case DealScope.OWNED:
        accessWhere.creatorId = userId;
        break;

      case DealScope.SHARED:
        accessWhere.creatorId = {
          not: userId,
        };
        accessWhere.participants = {
          some: {
            userId,
          },
        };
        break;

      case DealScope.ALL:
      default:
        accessWhere.OR = [
          {
            creatorId: userId,
          },
          {
            participants: {
              some: {
                userId,
              },
            },
          },
        ];
        break;
    }

    const filters: Prisma.DealWhereInput[] = [
      accessWhere,
    ];

    if (query.status) {
      filters.push({
        status: query.status,
      });
    }

    if (query.search) {
      filters.push({
        OR: [
          {
            title: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            property: {
              is: {
                name: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            },
          },
          {
            property: {
              is: {
                address: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            },
          },
        ],
      });
    }

    const where: Prisma.DealWhereInput = {
      AND: filters,
    };

    const [deals, total] = await this.prisma.$transaction([
      this.prisma.deal.findMany({
        where,
        include: dealInclude,
        orderBy: {
          [query.sortBy ?? 'updatedAt']: query.sortOrder ?? 'desc',
        },
        skip,
        take: limit,
      }),

      this.prisma.deal.count({
        where,
      }),
    ]);

    const data = deals.map((deal) => ({
      ...deal,
      progress: this.calculateProgress(deal.status),
    }));

    return {
      success: true,
      message: 'Deals retrieved successfully',
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(
    id: string, 
    userId: string
  ) {
    const deal = await this.prisma.deal.findFirst({
      where: {
        id,
        OR: [
          {
            creatorId: userId,
          },
          {
            participants: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      include: dealInclude,
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    const data = {
      ...deal,
      progress: this.calculateProgress(deal.status),
    };

    return {
      success: true,
      message: 'Deal retrieved successfully',
      data,
    };
  }

  async update(
    id: string, 
    userId: string, 
    dto: UpdateDealDto
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
      deal.status === DealStatus.FUNDED ||
      deal.status === DealStatus.COMPLETED
    ) {
      throw new ForbiddenException('This deal can no longer be modified');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.propertyId !== undefined) {
        const property = await tx.property.findFirst({
          where: {
            id: dto.propertyId,
            ownerId: userId,
          },
        });

        if (!property) {
          throw new NotFoundException('Property not found.');
        }
      }

      await tx.deal.update({
        where: { id },
        data: {
          title: dto.title,
          ...(dto.propertyId !== undefined && {
            propertyId: dto.propertyId,
          }),
        },
      });

      if (dto.creatorRole !== undefined) {
        const participant = await tx.dealParticipant.findFirst({
          where: {
            dealId: id,
            userId,
          },
        });

        if (participant) {
          await tx.dealParticipant.update({
            where: {
              id: participant.id,
            },
            data: {
              role: dto.creatorRole,
            },
          });
        } else {
          await tx.dealParticipant.create({
            data: {
              dealId: id,
              userId,
              role: dto.creatorRole,
              status: 'ACCEPTED',
              joinedAt: new Date(),
            },
          });
        }
      }

      if (dto.terms) {
        const existingTerms = await tx.dealTerms.findUnique({
          where: {
            dealId: id,
          },
        });

        const termsData = {
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
        };

        if (existingTerms) {
          await tx.dealTerms.update({
            where: {
              dealId: id,
            },
            data: termsData,
          });
        } else {
          await tx.dealTerms.create({
            data: {
              dealId: id,
              dealType: dto.terms.dealType!,
              currency: dto.terms.currency!,
              dealValue: new Prisma.Decimal(dto.terms.dealValue!),
              earnestMoney:
                dto.terms.earnestMoney !== undefined
                  ? new Prisma.Decimal(dto.terms.earnestMoney)
                  : null,
              closingDate: new Date(dto.terms.closingDate!),
              longStopDate: dto.terms.longStopDate
                ? new Date(dto.terms.longStopDate)
                : null,
              paymentStructure: dto.terms.paymentStructure!,
            },
          });
        }
      }

      if (dto.escrow) {
        const existingEscrow = await tx.escrow.findUnique({
          where: {
            dealId: id,
          },
        });

        if (existingEscrow) {
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
            await tx.escrowReleaseCondition.deleteMany({
              where: {
                escrowId: existingEscrow.id,
              },
            });

            await tx.escrowReleaseCondition.createMany({
              data: dto.escrow.releaseConditions.map(
                (description, index) => ({
                  escrowId: existingEscrow.id,
                  description,
                  sortOrder: index + 1,
                }),
              ),
            });
          }
        } else {
          if (
            dto.escrow.amount === undefined ||
            dto.escrow.fundingSource === undefined ||
            dto.escrow.holdingPeriod === undefined
          ) {
            throw new ForbiddenException(
              'Amount, funding source and holding period are required to create escrow.',
            );
          }

          let currency = dto.terms?.currency;

          if (!currency) {
            const existingTerms = await tx.dealTerms.findUnique({
              where: {
                dealId: id,
              },
            });

            currency = existingTerms?.currency;
          }

          if (!currency) {
            throw new ForbiddenException(
              'Deal currency is required before creating escrow.',
            );
          }

          await tx.escrow.create({
            data: {
              dealId: id,
              amount: new Prisma.Decimal(dto.escrow.amount),
              fundingSource: dto.escrow.fundingSource,
              holdingPeriod: dto.escrow.holdingPeriod,
              currency,
              releaseConditions: {
                create: (dto.escrow.releaseConditions ?? []).map(
                  (description, index) => ({
                    description,
                    sortOrder: index + 1,
                  }),
                ),
              },
            },
          });
        }
      }

      const updatedDeal = await tx.deal.findUnique({
        where: {
          id,
        },
        include: dealInclude,
      });

      if (!updatedDeal) {
        return {
          success: false,
          message: 'Failed to load updated deal',
        };
      }

      return {
        success: true,
        message: 'Deal updated successfully',
        data: {
          ...updatedDeal,
          progress: this.calculateProgress(updatedDeal.status),
        },
      };
    });
  }

  async publish(
    id: string,
    userId: string,
  ) {
    const deal = await this.prisma.deal.findUnique({
      where: {
        id,
      },
      include: {
        terms: true,
        escrow: {
          include: {
            releaseConditions: true,
          },
        },
        participants: true,
      },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    if (deal.creatorId !== userId) {
      throw new ForbiddenException(
        'Only the deal creator can publish this deal',
      );
    }

    if (deal.status !== DealStatus.DRAFT) {
      throw new ForbiddenException(
        'Only draft deals can be published',
      );
    }

    if (!deal.propertyId) {
      throw new ForbiddenException(
        'A property is required before publishing the deal',
      );
    }

    if (!deal.terms) {
      throw new ForbiddenException(
        'Deal terms are required before publishing the deal',
      );
    }

    if (!deal.escrow) {
      throw new ForbiddenException(
        'Escrow details are required before publishing the deal',
      );
    }

    if (deal.escrow.releaseConditions.length === 0) {
      throw new ForbiddenException(
        'At least one escrow release condition is required',
      );
    }

    const updatedDeal = await this.prisma.deal.update({
      where: {
        id,
      },
      data: {
        status: DealStatus.PENDING_PARTICIPANTS,
      },
      include: dealInclude,
    });

    return {
      success: true,
      message: 'Deal published successfully',
      data: {
        ...updatedDeal,
        progress: this.calculateProgress(updatedDeal.status),
      },
    };
  }

  async remove(id: string, userId: string) {
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
      deal.status === DealStatus.FUNDED ||
      deal.status === DealStatus.COMPLETED
    ) {
      throw new ForbiddenException('This deal can no longer be deleted');
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

  private async generateReference(tx: Prisma.TransactionClient) {
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
