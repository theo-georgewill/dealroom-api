import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../../integrations/mail/mail.service';

import { randomBytes } from 'crypto';

import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { ParticipantRole } from '@prisma/client';

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);
  private static readonly INVITATION_EXPIRY_DAYS = 7;
  private static readonly TOKEN_BYTES = 32;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async create(dealId: string, userId: string, dto: CreateInvitationDto) {
    const deal = await this.prisma.deal.findUnique({
      where: {
        id: dealId,
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    if (deal.creatorId !== userId) {
      throw new ForbiddenException(
        'Only the deal creator can invite participants',
      );
    }

    const email = dto.email.trim().toLowerCase();

    if (email === deal.creator.email.toLowerCase()) {
      throw new BadRequestException('You cannot invite yourself');
    }
    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        dealId,
        email,
        status: {
          in: ['PENDING', 'ACCEPTED'],
        },
      },
    });

    if (existingInvitation) {
      throw new BadRequestException('User has already been invited');
    }

    const existingParticipant = await this.prisma.dealParticipant.findFirst({
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

    const token = this.generateToken();

    const invitation = await this.prisma.invitation.create({
      data: {
        dealId,
        email,
        role: dto.role,
        token,
        invitedById: userId,
        expiresAt: this.getExpiryDate(),
      },
    });

    const invitationUrl = `${this.configService.getOrThrow<string>(
      'FRONTEND_URL',
    )}/invitations/${token}`;

    const inviterName = `${deal.creator.firstName} ${deal.creator.lastName}`;

    await this.sendInvitationEmail({
      to: invitation.email,
      inviterName,
      dealTitle: deal.title,
      role: invitation.role,
      invitationUrl,
      expiresAt: invitation.expiresAt,
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
    let invitation = await this.prisma.invitation.findUnique({
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
      throw new NotFoundException('Invitation not found');
    }

    invitation = await this.expireIfNeeded(invitation);

    return {
      success: true,
      message: 'Invitation retrieved successfully',
      data: invitation,
    };
  }

  async accept(token: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const invitation = await tx.invitation.findUnique({
        where: {
          token,
        },
      });

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      if (invitation.status !== 'PENDING') {
        throw new BadRequestException('Invitation has already been used');
      }

      if (invitation.expiresAt < new Date()) {
        throw new BadRequestException('Invitation has expired');
      }

      const user = await tx.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
        throw new ForbiddenException('This invitation belongs to another user');
      }

      const existingParticipant = await tx.dealParticipant.findFirst({
        where: {
          dealId: invitation.dealId,
          userId,
        },
      });

      if (existingParticipant) {
        throw new BadRequestException(
          'You are already a participant in this deal',
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
          acceptedAt: new Date(),
        },
      });

      const pendingInvitations = await tx.invitation.count({
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

  async decline(token: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const invitation = await tx.invitation.findUnique({
        where: {
          token,
        },
      });

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      if (invitation.status !== 'PENDING') {
        throw new BadRequestException('Invitation has already been used');
      }

      if (invitation.expiresAt < new Date()) {
        throw new BadRequestException('Invitation has expired');
      }

      const user = await tx.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
        throw new ForbiddenException('This invitation belongs to another user');
      }

      await tx.invitation.update({
        where: {
          id: invitation.id,
        },
        data: {
          status: 'DECLINED',
          declinedAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Invitation declined successfully',
      };
    });
  }

  async cancel(dealId: string, invitationId: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: {
        id: invitationId,
      },
      include: {
        deal: {
          select: {
            id: true,
            creatorId: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.deal.id !== dealId) {
      throw new BadRequestException('Invitation does not belong to this deal');
    }

    if (invitation.deal.creatorId !== userId) {
      throw new ForbiddenException(
        'Only the deal creator can cancel invitations',
      );
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException(
        `Invitation is ${invitation.status.toLowerCase()}`,
      );
    }

    await this.prisma.invitation.update({
      where: {
        id: invitation.id,
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(), // Remove if your schema doesn't have this field
      },
    });

    return {
      success: true,
      message: 'Invitation cancelled successfully',
    };
  }

  async resend(dealId: string, invitationId: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: {
        id: invitationId,
      },
      include: {
        deal: {
          include: {
            creator: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.deal.id !== dealId) {
      throw new BadRequestException('Invitation does not belong to this deal');
    }

    if (invitation.deal.creatorId !== userId) {
      throw new ForbiddenException(
        'Only the deal creator can resend invitations',
      );
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException(
        `Invitation is ${invitation.status.toLowerCase()}`,
      );
    }

    const token = this.generateToken();

    const updatedInvitation = await this.prisma.invitation.update({
      where: {
        id: invitation.id,
      },
      data: {
        token,
        expiresAt: this.getExpiryDate(),
      },
    });

    const invitationUrl = `${this.configService.getOrThrow<string>(
      'FRONTEND_URL',
    )}/invitations/${token}`;

    const inviterName = `${invitation.deal.creator.firstName} ${invitation.deal.creator.lastName}`;

    await this.sendInvitationEmail({
      to: updatedInvitation.email,
      inviterName,
      dealTitle: invitation.deal.title,
      role: updatedInvitation.role,
      invitationUrl,
      expiresAt: updatedInvitation.expiresAt,
    });

    return {
      success: true,
      message: 'Invitation resent successfully',
      data: {
        id: updatedInvitation.id,
        email: updatedInvitation.email,
        status: updatedInvitation.status,
        expiresAt: updatedInvitation.expiresAt,
      },
    };
  }

  async listForDeal(dealId: string, userId: string) {
    const deal = await this.prisma.deal.findUnique({
      where: {
        id: dealId,
      },
      select: {
        creatorId: true,
      },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    if (deal.creatorId !== userId) {
      throw new ForbiddenException(
        'Only the deal creator can view invitations',
      );
    }

    const invitations = await this.prisma.invitation.findMany({
      where: {
        dealId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        acceptedAt: true,
        declinedAt: true,
        cancelledAt: true,
        createdAt: true,
        updatedAt: true,
        acceptedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Invitations retrieved successfully',
      data: invitations,
    };
  }

  private generateToken(): string {
    return randomBytes(InvitationsService.TOKEN_BYTES).toString('hex');
  }

  private getExpiryDate(): Date {
    return new Date(
      Date.now() +
        InvitationsService.INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );
  }

  private async sendInvitationEmail(params: {
    to: string;
    inviterName: string;
    dealTitle: string;
    role: ParticipantRole;
    invitationUrl: string;
    expiresAt: Date;
  }) {
    try {
      await this.mailService.sendInvitation(params);
    } catch (error) {
      this.logger.error(
        `Failed to send invitation email to ${params.to}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async expireIfNeeded<
    T extends {
      id: string;
      status: string;
      expiresAt: Date;
    },
  >(invitation: T): Promise<T> {
    if (invitation.status === 'PENDING' && invitation.expiresAt < new Date()) {
      await this.prisma.invitation.update({
        where: {
          id: invitation.id,
        },
        data: {
          status: 'EXPIRED',
        },
      });

      invitation.status = 'EXPIRED';
    }

    return invitation;
  }
}
