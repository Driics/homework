import { z } from 'zod';

export const CurrencySchema = z.enum(['USD', 'EUR', 'GBP']);
export type Currency = z.infer<typeof CurrencySchema>;

export const DirectionSchema = z.enum(['DEBIT', 'CREDIT']);
export type Direction = z.infer<typeof DirectionSchema>;
