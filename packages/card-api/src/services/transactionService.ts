import type { Transaction } from '@homework/shared';
import type { PrismaClient } from '@prisma/client';
import { type PaginatedResult, paginateBy } from '../lib/pagination.js';
import { loadOwnedCard } from './cardService.js';

function toDto(row: {
  id: string;
  cardId: string;
  authorizationId: string | null;
  amountMinor: number;
  direction: string;
  currency: string;
  merchantName: string;
  merchantCategory: string;
  merchantCountry: string;
  merchantCity: string;
  kind: string;
  description: string;
  postedAt: Date;
}): Transaction {
  return {
    id: row.id,
    cardId: row.cardId,
    authorizationId: row.authorizationId,
    amountMinor: row.amountMinor,
    direction: row.direction as Transaction['direction'],
    currency: row.currency as Transaction['currency'],
    merchantName: row.merchantName,
    merchantCategory: row.merchantCategory,
    merchantCountry: row.merchantCountry,
    merchantCity: row.merchantCity,
    kind: row.kind as Transaction['kind'],
    description: row.description,
    postedAt: row.postedAt.toISOString(),
  };
}

export async function listCardTransactions(
  prisma: PrismaClient,
  userId: string,
  cardId: string,
  opts: { limit: number; cursor?: string | null },
): Promise<PaginatedResult<Transaction>> {
  await loadOwnedCard(prisma, userId, cardId);
  const rows = await prisma.transaction.findMany({
    where: { cardId },
    orderBy: [{ postedAt: 'desc' }, { id: 'desc' }],
    take: opts.limit + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
  });
  const page = paginateBy(rows, { limit: opts.limit });
  return { items: page.items.map(toDto), nextCursor: page.nextCursor };
}
