import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { BankAccountsService } from './bank-accounts.service';
import { LookupBankAccountDto } from './dto/lookup-bank-account.dto';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@ApiTags('Bank Accounts')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller({
  path: 'bank-accounts',
  version: '1',
})
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Post('lookup')
  @ApiOperation({
    summary: 'Lookup bank account',
  })
  lookup(@Body() dto: LookupBankAccountDto) {
    return this.bankAccountsService.lookup(dto.bankCode, dto.accountNumber);
  }

  @Post()
  @ApiOperation({
    summary: 'Save bank account',
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBankAccountDto,
  ) {
    return this.bankAccountsService.create(
      user.id,
      dto.bankCode,
      dto.accountNumber,
    );
  }

  @Get('me')
  @ApiOperation({
    summary: 'Get my bank accounts',
  })
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.bankAccountsService.findMine(user.id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete bank account',
  })
  @ApiParam({
    name: 'id',
    description: 'Bank account ID',
  })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.bankAccountsService.remove(user.id, id);
  }
}
