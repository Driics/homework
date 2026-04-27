import { z } from 'zod';
import { CurrencySchema, DirectionSchema } from './common.js';

export const TxKindSchema = z.enum(['PURCHASE', 'REFUND', 'REVERSAL', 'FEE', 'ADJUSTMENT']);
export type TxKind = z.infer<typeof TxKindSchema>;

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  cardId: z.string().uuid(),
  authorizationId: z.string().uuid().nullable(),
  amountMinor: z.number().int().nonnegative(),
  direction: DirectionSchema,
  currency: CurrencySchema,
  merchantName: z.string().min(1),
  merchantCategory: z.string().min(1),
  merchantCountry: z.string().length(2),
  merchantCity: z.string().min(1),
  kind: TxKindSchema,
  description: z.string(),
  postedAt: z.string().datetime(),
});
export type Transaction = z.infer<typeof TransactionSchema>;
