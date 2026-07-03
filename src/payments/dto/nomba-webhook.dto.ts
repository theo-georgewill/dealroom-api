export class NombaWebhookDto {
  event!: string;

  requestId!: string;

  data!: {
    merchantTxRef: string;
    amount: number;
    currency: string;
  };
}