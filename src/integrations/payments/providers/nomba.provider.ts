import type { AxiosError, AxiosResponse } from 'axios';
import type { NombaResponse } from '../types/nomba-response.type';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PaymentProvider } from '../interfaces/payment-provider.interface';
import type {
  BankAccountLookup,
  CheckoutOrder,
  Transfer,
} from '../types/payment-provider.types';

@Injectable()
export class NombaProvider implements PaymentProvider {
  private readonly logger = new Logger(NombaProvider.name);

  private accessToken?: string;
  private expiresAt?: Date;

  private static readonly TOKEN_SAFETY_MARGIN_MS = 2 * 60 * 1000;

  constructor(private readonly http: HttpService) {}

  private async getAccessToken(): Promise<string> {
    // Return cached token if it is still valid (with a safety margin)
    if (
      this.accessToken &&
      this.expiresAt &&
      this.expiresAt.getTime() - Date.now() >
        NombaProvider.TOKEN_SAFETY_MARGIN_MS
    ) {
      return this.accessToken;
    }

    try {
      const {
        data,
      }: AxiosResponse<
        NombaResponse<{
          access_token: string;
          expiresAt: string;
        }>
      > = await firstValueFrom(
        this.http.post(
          `${process.env.NOMBA_BASE_URL}/v1/auth/token/issue`,
          {
            grant_type: 'client_credentials',
            client_id: process.env.NOMBA_CLIENT_ID,
            client_secret: process.env.NOMBA_CLIENT_SECRET,
          },
          {
            headers: {
              accountId: process.env.NOMBA_ACCOUNT_ID,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      if (!data?.data?.access_token) {
        throw new Error('Access token missing from Nomba response');
      }

      const token = data.data.access_token;
      if (!token) {
        throw new Error('Access token missing from Nomba response');
      }

      this.accessToken = token;
      this.expiresAt = new Date(data.data.expiresAt);

      return token;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{
        description?: string;
        message?: string;
      }>;

      this.logger.error(
        'Failed to obtain Nomba access token',
        axiosError.response?.data ?? axiosError.message,
      );

      throw new InternalServerErrorException(
        'Unable to authenticate with Nomba',
      );
    }
  }

  async createCheckoutOrder(data: {
    orderReference: string;
    amount: number;
    customerEmail: string;
    currency?: string;
    callbackUrl?: string;
    tokenizeCard?: boolean;
  }): Promise<CheckoutOrder> {
    try {
      const token = await this.getAccessToken();

      const { data: response }: AxiosResponse<NombaResponse<CheckoutOrder>> =
        await firstValueFrom(
          this.http.post(
            `${process.env.NOMBA_BASE_URL}/v1/checkout/order`,
            {
              order: {
                orderReference: data.orderReference,
                amount: data.amount.toFixed(2),
                currency: data.currency ?? 'NGN',
                customerEmail: data.customerEmail,
                callbackUrl: data.callbackUrl ?? process.env.NOMBA_CALLBACK_URL,
              },
              tokenizeCard: data.tokenizeCard ?? true,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                accountId: process.env.NOMBA_ACCOUNT_ID,
                'Content-Type': 'application/json',
              },
            },
          ),
        );

      if (response.code !== '00') {
        throw new InternalServerErrorException(
          response.description ?? 'Unable to create Nomba checkout order',
        );
      }

      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{
        description?: string;
        message?: string;
      }>;

      this.logger.error(
        'Failed to create checkout order',
        axiosError.response?.data ?? axiosError.message,
      );

      throw new InternalServerErrorException(
        axiosError.response?.data?.description ??
          axiosError.response?.data?.message ??
          'Unable to initialize payment',
      );
    }
  }

  async lookupBankAccount(
    bankCode: string,
    accountNumber: string,
  ): Promise<BankAccountLookup> {
    try {
      const token = await this.getAccessToken();

      const {
        data: response,
      }: AxiosResponse<NombaResponse<BankAccountLookup>> = await firstValueFrom(
        this.http.post(
          `${process.env.NOMBA_BASE_URL}/v1/transfers/bank/lookup`,
          {
            bankCode,
            accountNumber,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              accountId: process.env.NOMBA_ACCOUNT_ID,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      if (response.code !== '00') {
        throw new InternalServerErrorException(
          response.description ?? 'Unable to lookup bank account',
        );
      }

      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{
        description?: string;
        message?: string;
      }>;

      this.logger.error(
        'Bank account lookup failed',
        axiosError.response?.data ?? axiosError.message,
      );

      throw new InternalServerErrorException(
        axiosError.response?.data?.description ??
          axiosError.response?.data?.message ??
          'Unable to lookup bank account',
      );
    }
  }

  async createTransfer(data: {
    amount: number;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    senderName: string;
    narration: string;
    merchantTxRef: string;
  }): Promise<Transfer> {
    try {
      const token = await this.getAccessToken();

      const { data: response }: AxiosResponse<NombaResponse<Transfer>> =
        await firstValueFrom(
          this.http.post(
            `${process.env.NOMBA_BASE_URL}/v1/transfers/bank`,
            {
              amount: data.amount,
              bankCode: data.bankCode,
              accountNumber: data.accountNumber,
              accountName: data.accountName,
              senderName: data.senderName,
              narration: data.narration,
              merchantTxRef: data.merchantTxRef,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                accountId: process.env.NOMBA_ACCOUNT_ID,
                'Content-Type': 'application/json',
              },
            },
          ),
        );

      if (response.code !== '00') {
        throw new InternalServerErrorException(
          response.description ?? 'Unable to create transfer',
        );
      }

      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{
        description?: string;
        message?: string;
      }>;

      console.log('================ TRANSFER ERROR ================');
      console.log('Status:', axiosError.response?.status);

      console.log('Response:');
      console.dir(axiosError.response?.data, {
        depth: null,
        colors: true,
      });

      console.log('Message:', axiosError.message);

      throw new InternalServerErrorException(
        axiosError.response?.data?.description ??
          axiosError.response?.data?.message ??
          JSON.stringify(axiosError.response?.data) ??
          'Unable to initiate transfer',
      );
    }
  }

  async getTransfer(merchantTxRef: string): Promise<Transfer> {
    try {
      const token = await this.getAccessToken();

      const { data: response }: AxiosResponse<NombaResponse<Transfer>> =
        await firstValueFrom(
          this.http.get(
            `${process.env.NOMBA_BASE_URL}/v1/transfers/${merchantTxRef}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                accountId: process.env.NOMBA_ACCOUNT_ID,
              },
            },
          ),
        );

      if (response.code !== '00') {
        throw new InternalServerErrorException(
          response.description ?? 'Unable to fetch transfer',
        );
      }

      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{
        description?: string;
        message?: string;
      }>;

      this.logger.error(
        'Failed to fetch transfer',
        axiosError.response?.data ?? axiosError.message,
      );

      throw new InternalServerErrorException(
        axiosError.response?.data?.description ??
          axiosError.response?.data?.message ??
          'Unable to fetch transfer',
      );
    }
  }
}
