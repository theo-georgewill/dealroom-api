import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InvitationsService } from '../invitations/invitations.service';
import { CreateInvitationDto } from '../invitations/dto/create-invitation.dto';

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
    description:
      'Creates a new escrow deal for the authenticated user.',
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
  create(
    @CurrentUser() user: any,
    @Body() dto: CreateDealDto,
  ) {
    return this.dealsService.create(
      user.id,
      dto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get all deals',
    description:
      'Returns all deals that belong to the authenticated user.',
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
    @CurrentUser() user: any,
  ) {
    return this.dealsService.findAll(
      user.id,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a deal by ID',
    description:
      'Returns a single deal owned by the authenticated user.',
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
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.dealsService.findOne(
      id,
      user.id,
    );
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a deal',
    description:
      'Updates an existing deal owned by the authenticated user.',
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
    @CurrentUser() user: any,
    @Body() dto: UpdateDealDto,
  ) {
    return this.dealsService.update(
      id,
      user.id,
      dto,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a deal',
    description:
      'Deletes a deal owned by the authenticated user.',
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
  remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.dealsService.remove(
      id,
      user.id,
    );
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
    @CurrentUser() user: any,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.invitationsService.create(
      dealId,
      user.id,
      dto,
    );
  }
}