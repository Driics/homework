import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { listCardActivity } from '../../src/services/activityService.js';
import { type TestDb, makeTestDb } from '../helpers/prisma.js';

let db: TestDb;
let aliceId: string;
let cardId: string;

beforeAll(async () => {
  db = await makeTestDb();
  const alice = await db.prisma.user.create({
    data: { email: 'a@x.com', passwordHash: 'x', fullName: 'A' },
  });
  aliceId = alice.id;
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
  cardId = card.id;
  await db.prisma.authorization.create({
    data: {
      cardId,
      amountMinor: 500,
      direction: 'DEBIT',
      currency: 'USD',
      merchantName: 'Auth1',
      merchantCategory: 'Grocery',
      merchantCountry: 'US',
      merchantCity: 'NYC',
      status: 'PENDING',
      authorizedAt: new Date(Date.UTC(2026, 3, 23)),
      expiresAt: new Date(Date.UTC(2026, 3, 30)),
    },
  });
  await db.prisma.transaction.create({
    data: {
      cardId,
      amountMinor: 200,
      direction: 'DEBIT',
      currency: 'USD',
      merchantName: 'Tx1',
      merchantCategory: 'Dining',
      merchantCountry: 'US',
      merchantCity: 'NYC',
      kind: 'PURCHASE',
      description: 'lunch',
      postedAt: new Date(Date.UTC(2026, 3, 22)),
    },
  });
});
afterAll(async () => {
  await db.cleanup();
});

describe('listCardActivity', () => {
  it('merges authorizations and transactions reverse-chronologically with discriminator', async () => {
    const r = await listCardActivity(db.prisma, aliceId, cardId, { limit: 10 });
    expect(r.items.map((i) => i.type)).toEqual(['authorization', 'transaction']);
  });
});
