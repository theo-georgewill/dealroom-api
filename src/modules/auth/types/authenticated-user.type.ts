// src/auth/types/authenticated-user.type.ts

import { User } from '@prisma/client';

export type AuthenticatedUser = Pick<
  User,
  'id' | 'firstName' | 'lastName' | 'email' | 'avatar'
>;
