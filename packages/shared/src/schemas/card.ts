import { z } from 'zod';
import { CurrencySchema } from './common.js';

export const CardStatusSchema = z.enum(['ACTIVE', 'FROZEN', 'EXPIRED']);
export type CardStatus = z.infer<typeof CardStatusSchema>;

export const CardTypeSchema = z.enum(['VIRTUAL', 'PHYSICAL']);
export type CardType = z.infer<typeof CardTypeSchema>;

export const CardSchema = z.object({
  id: z.string().uuid(),
  maskedPan: z.string().min(1),
  last4: z.string().length(4),
  cardholderName: z.string().min(1),
  expiryMonth: z.number().int().min(1).max(12),
  expiryYear: z.number().int().min(2000),
  currency: CurrencySchema,
  ledgerBalanceMinor: z.number().int(),
  availableBalanceMinor: z.number().int(),
  status: CardStatusSchema,
  type: CardTypeSchema,
  createdAt: z.string().datetime(),
});
export type Card = z.infer<typeof CardSchema>;
