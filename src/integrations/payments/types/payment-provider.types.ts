export interface CheckoutOrder {
  orderReference: string;
  checkoutLink: string;
}

export interface BankAccountLookup {
  accountName: string;
  accountNumber: string;
  bankCode: string;
}

export interface Transfer {
  transactionId: string;
  merchantTxRef: string;
  status: string;
}
