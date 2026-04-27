import { z } from 'zod';
import { CurrencySchema, DirectionSchema } from './common.js';

export const AuthorizationStatusSchema = z.enum([
  'PENDING',
  'APPROVED',
  'DECLINED',
  'REVERSED',
  'CAPTURED',
]);
export type AuthorizationStatus = z.infer<typeof AuthorizationStatusSchema>;

export const AuthorizationSchema = z.object({
  id: z.string().uuid(),
  cardId: z.string().uuid(),
  amountMinor: z.number().int().positive(),
  direction: DirectionSchema,
  currency: CurrencySchema,
  merchantName: z.string().min(1),
  merchantCategory: z.string().min(1),
  merchantCountry: z.string().length(2),
  merchantCity: z.string().min(1),
  status: AuthorizationStatusSchema,
  declineReason: z.string().nullable(),
  authorizedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});
export type Authorization = z.infer<typeof AuthorizationSchema>;
