import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { InvitationsService } from './invitations.service';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('Invitations')
@Controller({
  path: 'invitations',
  version: '1',
})
export class InvitationsController {
  constructor(
    private readonly invitationsService: InvitationsService,
  ) {}

  @Get(':token')
  @ApiOperation({
    summary: 'Get invitation details',
    description:
      'Retrieves the details of an invitation using its unique invitation token.',
  })
  @ApiParam({
    name: 'token',
    description: 'The unique invitation token.',
    example: '3a0f4a0e-8f4b-45d4-b0fa-4d2db8fdb2d1',
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Invitation not found or has expired.',
  })
  getInvitation(
    @Param('token') token: string,
  ) {
    return this.invitationsService.getInvitation(token);
  }

  @Post(':token/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Accept an invitation',
    description:
      'Allows an authenticated user to accept a deal invitation using the invitation token.',
  })
  @ApiParam({
    name: 'token',
    description: 'The unique invitation token.',
    example: '3a0f4a0e-8f4b-45d4-b0fa-4d2db8fdb2d1',
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation accepted successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: 404,
    description: 'Invitation not found.',
  })
  @ApiResponse({
    status: 409,
    description: 'Invitation has already been accepted.',
  })
  acceptInvitation(
    @Param('token') token: string,
    @CurrentUser() user: any,
  ) {
    return this.invitationsService.acceptInvitation(
      token,
      user.id,
    );
  }

  @Post(':token/decline')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  declineInvitation(
    @Param('token') token: string,
    @CurrentUser() user: any,
  ) {
    return this.invitationsService.declineInvitation(
      token,
      user.id,
    );
  }
}