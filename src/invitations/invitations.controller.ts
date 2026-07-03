import {
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { InvitationsService } from './invitations.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('invitations')
export class InvitationsController {
  constructor(
    private readonly invitationsService: InvitationsService,
  ) {}

  @Get(':token')
  findByToken(
    @Param('token') token: string,
  ) {
    return this.invitationsService.findByToken(token);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':token/accept')
  accept(
    @Param('token') token: string,
    @CurrentUser() user: any,
  ) {
    return this.invitationsService.accept(
      token,
      user.id,
    );
  }
}