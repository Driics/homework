import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { signToken } from '../../src/auth/jwt.js';
import { type TestApp, buildTestApp } from '../helpers/app.js';

let t: TestApp;
let aliceToken: string;
let cardId: string;

beforeAll(async () => {
  t = await buildTestApp();
  const alice = await t.db.prisma.user.create({
    data: { email: 'a@x.com', passwordHash: 'x', fullName: 'A' },
  });
  const card = await t.db.prisma.card.create({
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
  for (let i = 0; i < 3; i++) {
    await t.db.prisma.transaction.create({
      data: {
        cardId,
        amountMinor: 100,
        direction: 'DEBIT',
        currency: 'USD',
        merchantName: `M${i}`,
        merchantCategory: 'Grocery',
        merchantCountry: 'US',
        merchantCity: 'NYC',
        kind: 'PURCHASE',
        description: `d${i}`,
        postedAt: new Date(Date.UTC(2026, 3, 20 + i)),
      },
    });
  }
  aliceToken = (await signToken({ sub: alice.id, email: alice.email }, 'x'.repeat(32), 60)).token;
});
afterAll(async () => {
  await t.cleanup();
});

describe('GET /v1/cards/:cardId/transactions', () => {
  it('200 with cursor pagination', async () => {
    const r = await t.app.inject({
      method: 'GET',
      url: `/v1/cards/${cardId}/transactions?limit=2`,
      headers: { authorization: `Bearer ${aliceToken}` },
    });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.payload);
    expect(body.items).toHaveLength(2);
    expect(body.nextCursor).toBeTypeOf('string');
  });
});

describe('GET /v1/cards/:cardId/activity', () => {
  it('200 with discriminator', async () => {
    const r = await t.app.inject({
      method: 'GET',
      url: `/v1/cards/${cardId}/activity`,
      headers: { authorization: `Bearer ${aliceToken}` },
    });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.payload);
    expect(
      body.items.every((i: { type: string }) => ['authorization', 'transaction'].includes(i.type)),
    ).toBe(true);
  });
});
