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

import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('deals')
export class DealsController {
  constructor(
    private readonly dealsService: DealsService,
  ) {}

  @Post()
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
  findAll(
    @CurrentUser() user: any,
  ) {
    return this.dealsService.findAll(
      user.id,
    );
  }

  @Get(':id')
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
  remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.dealsService.remove(
      id,
      user.id,
    );
  }
}