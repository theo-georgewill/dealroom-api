import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { randomBytes } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    dealId: string,
    userId: string,
    dto: CreateInvitationDto,
  ) {
    const deal = await this.prisma.deal.findUnique({
      where: {
        id: dealId,
      },
    });

    if (!deal) {
      throw new NotFoundException(
        'Deal not found',
      );
    }

    if (deal.creatorId !== userId) {
      throw new ForbiddenException(
        'Only the deal creator can invite participants',
      );
    }

    const email = dto.email.trim().toLowerCase();

    const existingInvitation =
      await this.prisma.invitation.findFirst({
        where: {
          dealId,
          email,
          status: {
            in: ['PENDING', 'ACCEPTED'],
          },
        },
      });

    if (existingInvitation) {
      throw new BadRequestException(
        'User has already been invited',
      );
    }

    const existingParticipant =
      await this.prisma.dealParticipant.findFirst({
        where: {
          dealId,
          user: {
            email,
          },
        },
      });

    if (existingParticipant) {
      throw new BadRequestException(
        'User is already a participant in this deal',
      );
    }

    const token = randomBytes(32).toString('hex');

    const invitation =
      await this.prisma.invitation.create({
        data: {
          dealId,
          email,
          role: dto.role,
          token,
          invitedById: userId,
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ),
        },
      });

    return {
      success: true,
      message: 'Invitation created successfully',
      data: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
      },
    };
  }

  async findByToken(token: string) {
    const invitation =
      await this.prisma.invitation.findUnique({
        where: {
          token,
        },
        include: {
          deal: {
            select: {
              id: true,
              title: true,
              status: true,
              property: {
                select: {
                  name: true,
                  type: true,
                  address: true,
                  city: true,
                  state: true,
                  country: true,
                  description: true,
                  images: true,
                },
              },
              terms: {
                select: {
                  dealType: true,
                  currency: true,
                  dealValue: true,
                  earnestMoney: true,
                  closingDate: true,
                  longStopDate: true,
                  paymentStructure: true,
                },
              },
              escrow: {
                select: {
                  amount: true,
                  fundedAmount: true,
                  fundingSource: true,
                  holdingPeriod: true,
                  status: true,
                  releaseConditions: {
                    orderBy: {
                      sortOrder: 'asc',
                    },
                    select: {
                      description: true,
                      completed: true,
                      sortOrder: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!invitation) {
      throw new NotFoundException(
        'Invitation not found',
      );
    }

    return {
      success: true,
      message: 'Invitation retrieved successfully',
      data: invitation,
    };
  }

  async accept(
    token: string,
    userId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const invitation =
        await tx.invitation.findUnique({
          where: {
            token,
          },
        });

      if (!invitation) {
        throw new NotFoundException(
          'Invitation not found',
        );
      }

      if (invitation.status !== 'PENDING') {
        throw new BadRequestException(
          'Invitation has already been used',
        );
      }

      if (invitation.expiresAt < new Date()) {
        throw new BadRequestException(
          'Invitation has expired',
        );
      }

      const user = await tx.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        throw new NotFoundException(
          'User not found',
        );
      }

      if (
        user.email.toLowerCase() !==
        invitation.email.toLowerCase()
      ) {
        throw new ForbiddenException(
          'This invitation belongs to another user',
        );
      }

      await tx.dealParticipant.create({
        data: {
          dealId: invitation.dealId,
          userId,
          role: invitation.role,
          status: 'ACCEPTED',
          joinedAt: new Date(),
        },
      });

      await tx.invitation.update({
        where: {
          id: invitation.id,
        },
        data: {
          status: 'ACCEPTED',
          acceptedById: userId,
        },
      });

      const pendingInvitations =
        await tx.invitation.count({
          where: {
            dealId: invitation.dealId,
            status: 'PENDING',
          },
        });

      if (pendingInvitations === 0) {
        await tx.deal.update({
          where: {
            id: invitation.dealId,
          },
          data: {
            status: 'PENDING_FUNDING',
          },
        });
      }

      return {
        success: true,
        message: 'Invitation accepted successfully',
      };
    });
  }
}