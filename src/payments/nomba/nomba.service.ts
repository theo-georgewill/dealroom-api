import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NombaService {
  private readonly logger = new Logger(NombaService.name);

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
        NombaService.TOKEN_SAFETY_MARGIN_MS
    ) {
      return this.accessToken;
    }

    try {
      const { data } = await firstValueFrom(
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
    } catch (error: any) {
      this.logger.error(
        'Failed to obtain Nomba access token',
        error.response?.data ?? error.message,
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
  }) {
    try {
      const token = await this.getAccessToken();

      const { data: response } = await firstValueFrom(
        this.http.post(
          `${process.env.NOMBA_BASE_URL}/v1/checkout/order`,
          {
            order: {
              orderReference: data.orderReference,
              amount: data.amount.toFixed(2),
              currency: data.currency ?? 'NGN',
              customerEmail: data.customerEmail,
              callbackUrl:
                data.callbackUrl ??
                process.env.NOMBA_CALLBACK_URL,
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
          response.description ??
            'Unable to create Nomba checkout order',
        );
      }

      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Failed to create checkout order',
        error.response?.data ?? error.message,
      );

      throw new InternalServerErrorException(
        error.response?.data?.description ??
          error.response?.data?.message ??
          'Unable to initialize payment',
      );
    }
  }

  
}