import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ListDealsDto } from './dto/list-deals.dto';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InvitationsService } from '../invitations/invitations.service';
import { CreateInvitationDto } from '../invitations/dto/create-invitation.dto';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@ApiTags('Deals')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller({
  path: 'deals',
  version: '1',
})
export class DealsController {
  constructor(
    private readonly dealsService: DealsService,
    private readonly invitationsService: InvitationsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new deal',
    description: 'Creates a new escrow deal for the authenticated user.',
  })
  @ApiBody({ type: CreateDealDto })
  @ApiResponse({
    status: 201,
    description: 'Deal created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request payload.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDealDto) {
    return this.dealsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all deals',
    description: 'Returns all deals that belong to the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Deals retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListDealsDto,
  ) {
    return this.dealsService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a deal by ID',
    description: 'Returns a single deal owned by the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the deal.',
    example: 'b3d1d17d-f3d7-45d8-9f3c-5b13b0d7eec3',
  })
  @ApiResponse({
    status: 200,
    description: 'Deal retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found.',
  })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.dealsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a deal',
    description: 'Updates an existing deal owned by the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the deal.',
    example: 'b3d1d17d-f3d7-45d8-9f3c-5b13b0d7eec3',
  })
  @ApiBody({ type: UpdateDealDto })
  @ApiResponse({
    status: 200,
    description: 'Deal updated successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found.',
  })
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateDealDto,
  ) {
    return this.dealsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a deal',
    description: 'Deletes a deal owned by the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the deal.',
    example: 'b3d1d17d-f3d7-45d8-9f3c-5b13b0d7eec3',
  })
  @ApiResponse({
    status: 200,
    description: 'Deal deleted successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found.',
  })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.dealsService.remove(id, user.id);
  }

  @Post(':dealId/invitations')
  @ApiOperation({
    summary: 'Invite a participant',
    description:
      'Creates an invitation for a buyer or seller to join an existing deal.',
  })
  @ApiParam({
    name: 'dealId',
    description: 'The unique identifier of the deal.',
    example: 'b3d1d17d-f3d7-45d8-9f3c-5b13b0d7eec3',
  })
  @ApiBody({ type: CreateInvitationDto })
  @ApiResponse({
    status: 201,
    description: 'Invitation created successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found.',
  })
  createInvitation(
    @Param('dealId') dealId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.invitationsService.create(dealId, user.id, dto);
  }

  @Get(':dealId/invitations')
  @ApiOperation({
    summary: 'List deal invitations',
    description:
      'Returns all invitations for a deal owned by the authenticated user.',
  })
  @ApiParam({
    name: 'dealId',
    description: 'The unique identifier of the deal.',
    example: 'b3d1d17d-f3d7-45d8-9f3c-5b13b0d7eec3',
  })
  @ApiResponse({
    status: 200,
    description: 'Invitations retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found.',
  })
  listInvitations(
    @Param('dealId') dealId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.invitationsService.listForDeal(dealId, user.id);
  }

  @Post(':dealId/invitations/:invitationId/resend')
  @ApiOperation({
    summary: 'Resend an invitation',
    description:
      'Generates a new invitation token, extends the expiry date and resends the invitation email.',
  })
  @ApiParam({
    name: 'dealId',
    description: 'The unique identifier of the deal.',
  })
  @ApiParam({
    name: 'invitationId',
    description: 'The unique identifier of the invitation.',
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation resent successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Invitation not found.',
  })
  resendInvitation(
    @Param('dealId') dealId: string,
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.invitationsService.resend(dealId, invitationId, user.id);
  }

  @Patch(':dealId/invitations/:invitationId/cancel')
  @ApiOperation({
    summary: 'Cancel an invitation',
    description:
      'Cancels a pending invitation for a deal owned by the authenticated user.',
  })
  @ApiParam({
    name: 'dealId',
    description: 'The unique identifier of the deal.',
  })
  @ApiParam({
    name: 'invitationId',
    description: 'The unique identifier of the invitation.',
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation cancelled successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Invitation not found.',
  })
  cancelInvitation(
    @Param('dealId') dealId: string,
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.invitationsService.cancel(dealId, invitationId, user.id);
  }
}
