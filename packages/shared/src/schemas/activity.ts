import { z } from 'zod';
import { AuthorizationSchema } from './authorization.js';
import { TransactionSchema } from './transaction.js';

export const ActivityItemSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('authorization') }).merge(AuthorizationSchema),
  z.object({ type: z.literal('transaction') }).merge(TransactionSchema),
]);
export type ActivityItem = z.infer<typeof ActivityItemSchema>;
