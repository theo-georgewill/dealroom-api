import { ApiProperty } from '@nestjs/swagger';

export class NombaTransactionDto {
  @ApiProperty({
    example: 'DR-20260704-001',
    description:
      'The merchant transaction reference sent when the payment was initialized.',
  })
  merchantTxRef!: string;

  @ApiProperty({
    example: 50000000,
    description: 'The transaction amount.',
  })
  transactionAmount!: number;
}

export class NombaWebhookDataDto {
  @ApiProperty({
    type: NombaTransactionDto,
    description: 'Transaction details.',
  })
  transaction!: NombaTransactionDto;
}

export class NombaWebhookDto {
  @ApiProperty({
    example: 'payment_success',
    description: 'The webhook event type.',
  })
  event_type!: string;

  @ApiProperty({
    example: '49e11b44-909b-4f83-82b4-9a83aXXXXXX',
    description: 'Unique identifier for the webhook request.',
  })
  requestId!: string;

  @ApiProperty({
    type: NombaWebhookDataDto,
    description: 'Payment information associated with the webhook event.',
  })
  data!: NombaWebhookDataDto;
}