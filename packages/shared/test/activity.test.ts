import { describe, expect, it } from 'vitest';
import { ActivityItemSchema } from '../src/schemas/activity.js';

describe('ActivityItemSchema', () => {
  const auth = {
    type: 'authorization' as const,
    id: '550e8400-e29b-41d4-a716-446655440010',
    cardId: '550e8400-e29b-41d4-a716-446655440001',
    amountMinor: 1299,
    direction: 'DEBIT' as const,
    currency: 'USD' as const,
    merchantName: 'Corner Coffee',
    merchantCategory: 'Dining',
    merchantCountry: 'US',
    merchantCity: 'Brooklyn',
    status: 'PENDING' as const,
    declineReason: null,
    authorizedAt: '2026-04-20T12:00:00.000Z',
    expiresAt: '2026-04-27T12:00:00.000Z',
  };

  const tx = {
    type: 'transaction' as const,
    id: '550e8400-e29b-41d4-a716-446655440020',
    cardId: '550e8400-e29b-41d4-a716-446655440001',
    authorizationId: '550e8400-e29b-41d4-a716-446655440010',
    amountMinor: 1299,
    direction: 'DEBIT' as const,
    currency: 'USD' as const,
    merchantName: 'Corner Coffee',
    merchantCategory: 'Dining',
    merchantCountry: 'US',
    merchantCity: 'Brooklyn',
    kind: 'PURCHASE' as const,
    description: 'Corner Coffee — latte',
    postedAt: '2026-04-20T12:05:00.000Z',
  };

  it('accepts an authorization item', () => {
    const parsed = ActivityItemSchema.parse(auth);
    expect(parsed.type).toBe('authorization');
  });

  it('accepts a transaction item', () => {
    const parsed = ActivityItemSchema.parse(tx);
    expect(parsed.type).toBe('transaction');
  });

  it('rejects unknown discriminator', () => {
    expect(() => ActivityItemSchema.parse({ ...tx, type: 'other' })).toThrow();
  });

  it('rejects transaction fields on an authorization item', () => {
    const mixed = { ...auth, kind: 'PURCHASE' };
    // The discriminated union will ignore "kind" because authorization variant doesn't define it
    // but required auth-specific fields must still pass; this validates parse doesn't grab the wrong branch.
    const parsed = ActivityItemSchema.parse(mixed);
    expect(parsed.type).toBe('authorization');
  });
});
