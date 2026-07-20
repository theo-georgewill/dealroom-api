import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { EscrowService } from './escrow.service';
import { ReleaseEscrowDto } from './dto/release-escrow.dto';

@ApiTags('Escrow')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller({
  path: 'deals/:dealId/escrow',
  version: '1',
})
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  @Get()
  @ApiOperation({
    summary: 'Get escrow',
    description:
      'Retrieves the escrow associated with a deal. Only deal participants can access it.',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Unique identifier of the deal.',
    example: '8d9a4d58-7d2b-4e5d-a24b-5fd7b6b92c5c',
  })
  @ApiResponse({
    status: 200,
    description: 'Escrow retrieved successfully.',
  })
  @ApiResponse({
    status: 403,
    description: 'User is not a participant in this deal.',
  })
  @ApiResponse({
    status: 404,
    description: 'Escrow not found.',
  })
  findByDeal(@Param('dealId') dealId: string, @CurrentUser() user: any) {
    return this.escrowService.findByDeal(dealId, user.id);
  }

  @Post('release')
  @ApiOperation({
    summary: 'Release escrow funds',
    description:
      'Releases escrow funds to the seller. Only the buyer can perform this action once the escrow is fully funded.',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Unique identifier of the deal.',
  })
  @ApiResponse({
    status: 200,
    description: 'Escrow released successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Escrow cannot be released.',
  })
  @ApiResponse({
    status: 403,
    description: 'Only the buyer can release the escrow.',
  })
  @ApiResponse({
    status: 404,
    description: 'Escrow not found.',
  })
  release(
    @Param('dealId') dealId: string,
    @CurrentUser() user: any,
    @Body() dto: ReleaseEscrowDto,
  ) {
    return this.escrowService.release(dealId, user.id, dto);
  }
}
