import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { NotFoundError } from '../../src/errors.js';
import { listUserCards, loadOwnedCard } from '../../src/services/cardService.js';
import { type TestDb, makeTestDb } from '../helpers/prisma.js';

let db: TestDb;
let aliceId: string;
let bobId: string;
let aliceCardId: string;

beforeAll(async () => {
  db = await makeTestDb();
  const alice = await db.prisma.user.create({
    data: { email: 'a@x.com', passwordHash: 'x', fullName: 'Alice' },
  });
  const bob = await db.prisma.user.create({
    data: { email: 'b@x.com', passwordHash: 'x', fullName: 'Bob' },
  });
  aliceId = alice.id;
  bobId = bob.id;
  const card = await db.prisma.card.create({
    data: {
      userId: alice.id,
      maskedPan: '**** **** **** 1111',
      last4: '1111',
      cardholderName: 'Alice',
      expiryMonth: 12,
      expiryYear: 2030,
      currency: 'USD',
      ledgerBalanceMinor: 10_000,
      availableBalanceMinor: 10_000,
      status: 'ACTIVE',
      type: 'VIRTUAL',
    },
  });
  aliceCardId = card.id;
});
afterAll(async () => {
  await db.cleanup();
});

describe('loadOwnedCard', () => {
  it('returns the card for its owner', async () => {
    const card = await loadOwnedCard(db.prisma, aliceId, aliceCardId);
    expect(card.id).toBe(aliceCardId);
  });
  it('throws NotFoundError (CARD_NOT_FOUND) on cross-tenant access', async () => {
    await expect(loadOwnedCard(db.prisma, bobId, aliceCardId)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
  it('throws NotFoundError for non-existent card', async () => {
    await expect(
      loadOwnedCard(db.prisma, aliceId, '00000000-0000-0000-0000-000000000000'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('listUserCards', () => {
  it('lists only the user-owned cards', async () => {
    const cards = await listUserCards(db.prisma, aliceId);
    expect(cards.map((c) => c.id)).toEqual([aliceCardId]);
    const bobCards = await listUserCards(db.prisma, bobId);
    expect(bobCards).toEqual([]);
  });
});
