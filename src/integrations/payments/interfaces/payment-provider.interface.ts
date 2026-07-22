import type {
  BankAccountLookup,
  CheckoutOrder,
  Transfer,
} from '../types/payment-provider.types';

export interface PaymentProvider {
  createCheckoutOrder(data: {
    orderReference: string;
    amount: number;
    customerEmail: string;
    currency?: string;
    callbackUrl?: string;
    tokenizeCard?: boolean;
  }): Promise<CheckoutOrder>;

  lookupBankAccount(
    bankCode: string,
    accountNumber: string,
  ): Promise<BankAccountLookup>;

  createTransfer(data: {
    amount: number;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    senderName: string;
    narration: string;
    merchantTxRef: string;
  }): Promise<Transfer>;

  getTransfer(merchantTxRef: string): Promise<Transfer>;
}
