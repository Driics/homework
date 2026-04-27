import { describe, expect, it } from 'vitest';
import { TransactionSchema, TxKindSchema } from '../src/schemas/transaction.js';

describe('TxKindSchema', () => {
  it.each(['PURCHASE', 'REFUND', 'REVERSAL', 'FEE', 'ADJUSTMENT'])('accepts %s', (v) => {
    expect(TxKindSchema.parse(v)).toBe(v);
  });
});

describe('TransactionSchema', () => {
  const valid = {
    id: '550e8400-e29b-41d4-a716-446655440020',
    cardId: '550e8400-e29b-41d4-a716-446655440001',
    authorizationId: '550e8400-e29b-41d4-a716-446655440010',
    amountMinor: 1299,
    direction: 'DEBIT',
    currency: 'USD',
    merchantName: 'Corner Coffee',
    merchantCategory: 'Dining',
    merchantCountry: 'US',
    merchantCity: 'Brooklyn',
    kind: 'PURCHASE',
    description: 'Corner Coffee — latte and pastry',
    postedAt: '2026-04-20T12:05:00.000Z',
  };

  it('accepts a valid transaction', () => {
    expect(TransactionSchema.parse(valid)).toEqual(valid);
  });

  it('accepts null authorizationId (force-post case)', () => {
    expect(() => TransactionSchema.parse({ ...valid, authorizationId: null })).not.toThrow();
  });

  it('rejects negative amount', () => {
    expect(() => TransactionSchema.parse({ ...valid, amountMinor: -1 })).toThrow();
  });

  it('accepts zero amount (edge: adjustment to zero)', () => {
    expect(() => TransactionSchema.parse({ ...valid, amountMinor: 0 })).not.toThrow();
  });
});
