import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { signToken } from '../../src/auth/jwt.js';
import { type TestApp, buildTestApp } from '../helpers/app.js';

let t: TestApp;
let aliceToken: string;
let bobToken: string;
let aliceCardId: string;

beforeAll(async () => {
  t = await buildTestApp();
  const alice = await t.db.prisma.user.create({
    data: { email: 'a@x.com', passwordHash: 'x', fullName: 'A' },
  });
  const bob = await t.db.prisma.user.create({
    data: { email: 'b@x.com', passwordHash: 'x', fullName: 'B' },
  });
  const card = await t.db.prisma.card.create({
    data: {
      userId: alice.id,
      maskedPan: '****',
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
  aliceToken = (await signToken({ sub: alice.id, email: alice.email }, 'x'.repeat(32), 60)).token;
  bobToken = (await signToken({ sub: bob.id, email: bob.email }, 'x'.repeat(32), 60)).token;
});
afterAll(async () => {
  await t.cleanup();
});

describe('GET /v1/cards', () => {
  it('401 without token (MISSING_TOKEN)', async () => {
    const r = await t.app.inject({ method: 'GET', url: '/v1/cards' });
    expect(r.statusCode).toBe(401);
  });
  it('200 returns only owned cards', async () => {
    const r = await t.app.inject({
      method: 'GET',
      url: '/v1/cards',
      headers: { authorization: `Bearer ${aliceToken}` },
    });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.payload);
    expect(body.items.map((c: { id: string }) => c.id)).toEqual([aliceCardId]);
  });
  it('Bob gets empty list (no cards of his own)', async () => {
    const r = await t.app.inject({
      method: 'GET',
      url: '/v1/cards',
      headers: { authorization: `Bearer ${bobToken}` },
    });
    expect(JSON.parse(r.payload).items).toEqual([]);
  });
});

describe('GET /v1/cards/:cardId — cross-tenant enforcement', () => {
  it("returns 404 CARD_NOT_FOUND when Bob asks for Alice's card", async () => {
    const r = await t.app.inject({
      method: 'GET',
      url: `/v1/cards/${aliceCardId}`,
      headers: { authorization: `Bearer ${bobToken}` },
    });
    expect(r.statusCode).toBe(404);
    expect(JSON.parse(r.payload).code).toBe('CARD_NOT_FOUND');
  });
  it('200 when owner requests', async () => {
    const r = await t.app.inject({
      method: 'GET',
      url: `/v1/cards/${aliceCardId}`,
      headers: { authorization: `Bearer ${aliceToken}` },
    });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.payload).id).toBe(aliceCardId);
  });
});
