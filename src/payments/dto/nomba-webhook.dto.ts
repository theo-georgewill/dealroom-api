import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBooleanString,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class NombaMerchantDto {
  @ApiProperty()
  @IsString()
  walletId!: string;

  @ApiProperty()
  @IsNumber()
  walletBalance!: number;

  @ApiProperty()
  @IsString()
  userId!: string;
}

export class NombaTerminalDto {
  // Terminal is currently an empty object.
  // If Nomba starts populating it later, just add fields here.
}

export class NombaTokenizedCardDataDto {
  @ApiProperty()
  @IsString()
  tokenKey!: string;

  @ApiProperty()
  @IsString()
  cardType!: string;

  @ApiProperty()
  @IsString()
  tokenExpiryYear!: string;

  @ApiProperty()
  @IsString()
  tokenExpiryMonth!: string;

  @ApiProperty()
  @IsString()
  cardPan!: string;
}

export class NombaTransactionDto {
  @ApiProperty()
  @IsNumber()
  fee!: number;

  @ApiProperty()
  @IsString()
  type!: string;

  @ApiProperty()
  @IsString()
  transactionId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  responseCode?: string;

  @ApiProperty()
  @IsString()
  originatingFrom!: string;

  @ApiProperty()
  @IsString()
  merchantTxRef!: string;

  @ApiProperty()
  @IsNumber()
  transactionAmount!: number;

  @ApiProperty()
  @IsString()
  time!: string;
}

export class NombaCustomerDto {
  @ApiProperty()
  @IsString()
  billerId!: string;

  @ApiProperty()
  @IsString()
  senderName!: string;

  @ApiProperty()
  @IsString()
  productId!: string;
}

export class NombaOrderMetadataDto {
  @ApiProperty()
  @IsString()
  region!: string;
}

export class NombaOrderDto {
  @ApiProperty()
  @IsNumber()
  amount!: number;

  @ApiProperty()
  @IsString()
  orderId!: string;

  @ApiProperty()
  @IsString()
  cardType!: string;

  @ApiProperty({
    type: NombaOrderMetadataDto,
  })
  @ValidateNested()
  @Type(() => NombaOrderMetadataDto)
  orderMetaData!: NombaOrderMetadataDto;

  @ApiProperty()
  @IsString()
  accountId!: string;

  @ApiProperty()
  @IsString()
  cardLast4Digits!: string;

  @ApiProperty()
  @IsString()
  cardCurrency!: string;

  @ApiProperty()
  @IsString()
  customerEmail!: string;

  @ApiProperty()
  @IsString()
  customerId!: string;

  @ApiProperty()
  @IsBooleanString()
  isTokenizedCardPayment!: string;

  @ApiProperty()
  @IsString()
  orderReference!: string;

  @ApiProperty()
  @IsString()
  paymentMethod!: string;

  @ApiProperty()
  @IsString()
  callbackUrl!: string;

  @ApiProperty()
  @IsString()
  currency!: string;
}

export class NombaWebhookDataDto {
  @ApiProperty({
    type: NombaMerchantDto,
  })
  @ValidateNested()
  @Type(() => NombaMerchantDto)
  merchant!: NombaMerchantDto;

  @ApiProperty({
    type: NombaTerminalDto,
  })
  @ValidateNested()
  @Type(() => NombaTerminalDto)
  terminal!: NombaTerminalDto;

  @ApiProperty({
    type: NombaTokenizedCardDataDto,
  })
  @ValidateNested()
  @Type(() => NombaTokenizedCardDataDto)
  tokenizedCardData!: NombaTokenizedCardDataDto;

  @ApiProperty({
    type: NombaTransactionDto,
  })
  @ValidateNested()
  @Type(() => NombaTransactionDto)
  transaction!: NombaTransactionDto;

  @ApiProperty({
    type: NombaCustomerDto,
  })
  @ValidateNested()
  @Type(() => NombaCustomerDto)
  customer!: NombaCustomerDto;

  @ApiProperty({
    type: NombaOrderDto,
  })
  @ValidateNested()
  @Type(() => NombaOrderDto)
  order!: NombaOrderDto;
}

export class NombaWebhookDto {
  @ApiProperty()
  @IsString()
  event_type!: string;

  @ApiProperty()
  @IsString()
  requestId!: string;

  @ApiProperty({
    type: NombaWebhookDataDto,
  })
  @ValidateNested()
  @Type(() => NombaWebhookDataDto)
  data!: NombaWebhookDataDto;
}