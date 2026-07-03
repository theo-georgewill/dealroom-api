import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NombaService {
  constructor(
    private readonly http: HttpService,
  ) {}

  async initializePayment(data: {
    amount: number;
    reference: string;
    email: string;
  }) {
    try {
      const { data: response } = await firstValueFrom(
        this.http.post(
          `${process.env.NOMBA_BASE_URL}/checkout/order`,
          {
            order: {
              orderReference: data.reference,
              amount: data.amount * 100, // convert naira to kobo
              currency: 'NGN',
              customerEmail: data.email,
              callbackUrl:
                process.env.NOMBA_CALLBACK_URL,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.NOMBA_SECRET_KEY}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return response;
    } catch (error: any) {
      console.error(error.response?.data);

      throw new InternalServerErrorException(
        error.response?.data?.message ??
          'Unable to initialize payment',
      );
    }
  }
}