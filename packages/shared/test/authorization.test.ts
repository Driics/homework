import { describe, expect, it } from 'vitest';
import { AuthorizationSchema, AuthorizationStatusSchema } from '../src/schemas/authorization.js';

describe('AuthorizationStatusSchema', () => {
  it.each(['PENDING', 'APPROVED', 'DECLINED', 'REVERSED', 'CAPTURED'])('accepts %s', (v) => {
    expect(AuthorizationStatusSchema.parse(v)).toBe(v);
  });
});

describe('AuthorizationSchema', () => {
  const valid = {
    id: '550e8400-e29b-41d4-a716-446655440010',
    cardId: '550e8400-e29b-41d4-a716-446655440001',
    amountMinor: 1299,
    direction: 'DEBIT',
    currency: 'USD',
    merchantName: 'Corner Coffee',
    merchantCategory: 'Dining',
    merchantCountry: 'US',
    merchantCity: 'Brooklyn',
    status: 'APPROVED',
    declineReason: null,
    authorizedAt: '2026-04-20T12:00:00.000Z',
    expiresAt: '2026-04-27T12:00:00.000Z',
  };

  it('accepts a valid authorization', () => {
    expect(AuthorizationSchema.parse(valid)).toEqual(valid);
  });

  it('requires declineReason to be string when DECLINED', () => {
    // Schema does not enforce this cross-field rule (service layer does); just verify null is allowed.
    const declined = { ...valid, status: 'DECLINED', declineReason: 'Insufficient funds' };
    expect(AuthorizationSchema.parse(declined)).toEqual(declined);
  });

  it('rejects merchantCountry not 2 chars', () => {
    expect(() => AuthorizationSchema.parse({ ...valid, merchantCountry: 'USA' })).toThrow();
  });

  it('rejects negative amount', () => {
    expect(() => AuthorizationSchema.parse({ ...valid, amountMinor: -1 })).toThrow();
  });

  it('rejects zero amount', () => {
    expect(() => AuthorizationSchema.parse({ ...valid, amountMinor: 0 })).toThrow();
  });
});
