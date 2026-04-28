import type { ActivityItem, Authorization, Transaction } from '@homework/shared';
import type { PrismaClient } from '@prisma/client';
import { type PaginatedResult, paginateBy } from '../lib/pagination.js';
import { loadOwnedCard } from './cardService.js';

function authDto(row: {
  id: string;
  cardId: string;
  amountMinor: number;
  direction: string;
  currency: string;
  merchantName: string;
  merchantCategory: string;
  merchantCountry: string;
  merchantCity: string;
  status: string;
  declineReason: string | null;
  authorizedAt: Date;
  expiresAt: Date;
}): Authorization {
  return {
    id: row.id,
    cardId: row.cardId,
    amountMinor: row.amountMinor,
    direction: row.direction as Authorization['direction'],
    currency: row.currency as Authorization['currency'],
    merchantName: row.merchantName,
    merchantCategory: row.merchantCategory,
    merchantCountry: row.merchantCountry,
    merchantCity: row.merchantCity,
    status: row.status as Authorization['status'],
    declineReason: row.declineReason,
    authorizedAt: row.authorizedAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
  };
}

function txDto(row: {
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

export async function listCardActivity(
  prisma: PrismaClient,
  userId: string,
  cardId: string,
  opts: { limit: number; cursor?: string | null },
): Promise<PaginatedResult<ActivityItem>> {
  await loadOwnedCard(prisma, userId, cardId);

  const [auths, txs] = await Promise.all([
    prisma.authorization.findMany({
      where: { cardId },
      orderBy: [{ authorizedAt: 'desc' }, { id: 'desc' }],
      take: opts.limit * 2 + 1,
    }),
    prisma.transaction.findMany({
      where: { cardId },
      orderBy: [{ postedAt: 'desc' }, { id: 'desc' }],
      take: opts.limit * 2 + 1,
    }),
  ]);

  const merged: Array<ActivityItem & { _sortAt: number }> = [
    ...auths.map((a) => ({
      type: 'authorization' as const,
      ...authDto(a),
      _sortAt: a.authorizedAt.getTime(),
    })),
    ...txs.map((t) => ({
      type: 'transaction' as const,
      ...txDto(t),
      _sortAt: t.postedAt.getTime(),
    })),
  ].sort((a, b) => b._sortAt - a._sortAt);

  let startIdx = 0;
  if (opts.cursor) {
    const found = merged.findIndex((m) => m.id === opts.cursor);
    startIdx = found >= 0 ? found + 1 : 0;
  }
  const window = merged.slice(startIdx, startIdx + opts.limit + 1);
  const page = paginateBy(window, { limit: opts.limit });
  return {
    items: page.items.map((item) => {
      const { _sortAt: _s, ...rest } = item;
      return rest as ActivityItem;
    }),
    nextCursor: page.nextCursor,
  };
}
