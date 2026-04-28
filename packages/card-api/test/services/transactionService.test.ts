import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { NotFoundError } from '../../src/errors.js';
import { listCardTransactions } from '../../src/services/transactionService.js';
import { type TestDb, makeTestDb } from '../helpers/prisma.js';

let db: TestDb;
let aliceId: string;
let bobId: string;
let aliceCardId: string;

beforeAll(async () => {
  db = await makeTestDb();
  const alice = await db.prisma.user.create({
    data: { email: 'a@x.com', passwordHash: 'x', fullName: 'A' },
  });
  const bob = await db.prisma.user.create({
    data: { email: 'b@x.com', passwordHash: 'x', fullName: 'B' },
  });
  aliceId = alice.id;
  bobId = bob.id;
  const card = await db.prisma.card.create({
    data: {
      userId: alice.id,
      maskedPan: 'x',
      last4: '1111',
      cardholderName: 'A',
      expiryMonth: 1,
      expiryYear: 2030,
      currency: 'USD',
      ledgerBalanceMinor: 0,
      availableBalanceMinor: 0,
      status: 'ACTIVE',
      type: 'VIRTUAL',
    },
  });
  aliceCardId = card.id;
  for (let i = 0; i < 5; i++) {
    await db.prisma.transaction.create({
      data: {
        cardId: card.id,
        amountMinor: 100 + i,
        direction: 'DEBIT',
        currency: 'USD',
        merchantName: `M${i}`,
        merchantCategory: 'Grocery',
        merchantCountry: 'US',
        merchantCity: 'NYC',
        kind: 'PURCHASE',
        description: `tx${i}`,
        postedAt: new Date(Date.UTC(2026, 3, 20 + i)),
      },
    });
  }
});
afterAll(async () => {
  await db.cleanup();
});

describe('listCardTransactions', () => {
  it('returns newest first with cursor paging', async () => {
    const page1 = await listCardTransactions(db.prisma, aliceId, aliceCardId, { limit: 2 });
    expect(page1.items.map((t) => t.description)).toEqual(['tx4', 'tx3']);
    expect(page1.nextCursor).toBe(page1.items[1]?.id);
    const page2 = await listCardTransactions(db.prisma, aliceId, aliceCardId, {
      limit: 2,
      cursor: page1.nextCursor,
    });
    expect(page2.items.map((t) => t.description)).toEqual(['tx2', 'tx1']);
    const page3 = await listCardTransactions(db.prisma, aliceId, aliceCardId, {
      limit: 10,
      cursor: page2.nextCursor,
    });
    expect(page3.items.map((t) => t.description)).toEqual(['tx0']);
    expect(page3.nextCursor).toBeNull();
  });
  it('rejects cross-tenant access with 404', async () => {
    await expect(
      listCardTransactions(db.prisma, bobId, aliceCardId, { limit: 5 }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
