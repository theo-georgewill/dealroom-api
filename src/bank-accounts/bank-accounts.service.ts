import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { NombaService } from '../payments/nomba/nomba.service';

@Injectable()
export class BankAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nomba: NombaService,
  ) {}

  async lookup(bankCode: string, accountNumber: string) {
    return {
      success: true,
      data: await this.nomba.lookupBankAccount(bankCode, accountNumber),
    };
  }

  async create(userId: string, bankCode: string, accountNumber: string) {
    const account = await this.nomba.lookupBankAccount(bankCode, accountNumber);

    const existing = await this.prisma.bankAccount.findUnique({
      where: {
        userId_accountNumber: {
          userId,
          accountNumber,
        },
      },
    });

    if (existing) {
      return {
        success: true,
        message: 'Bank account already exists',
        data: existing,
      };
    }

    const bankAccount = await this.prisma.bankAccount.create({
      data: {
        userId,
        bankCode,
        accountNumber,
        accountName: account.accountName,
        verifiedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Bank account added successfully',
      data: bankAccount,
    };
  }

  async findMine(userId: string) {
    const account = await this.prisma.bankAccount.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      message: 'Bank account retrieved successfully',
      data: account,
    };
  }

  async remove(userId: string, bankAccountId: string) {
    const account = await this.prisma.bankAccount.findFirst({
      where: {
        id: bankAccountId,
        userId,
      },
    });

    if (!account) {
      throw new NotFoundException('Bank account not found');
    }

    await this.prisma.bankAccount.delete({
      where: {
        id: bankAccountId,
      },
    });

    return {
      success: true,
      message: 'Bank account removed',
    };
  }
}
