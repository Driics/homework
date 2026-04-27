import { describe, expect, it } from 'vitest';
import { CardSchema, CardStatusSchema, CardTypeSchema } from '../src/schemas/card.js';

describe('CardStatusSchema', () => {
  it.each(['ACTIVE', 'FROZEN', 'EXPIRED'])('accepts %s', (v) => {
    expect(CardStatusSchema.parse(v)).toBe(v);
  });
  it('rejects unknown status', () => {
    expect(() => CardStatusSchema.parse('CANCELED')).toThrow();
  });
});

describe('CardTypeSchema', () => {
  it.each(['VIRTUAL', 'PHYSICAL'])('accepts %s', (v) => {
    expect(CardTypeSchema.parse(v)).toBe(v);
  });
});

describe('CardSchema', () => {
  const valid = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    maskedPan: '•••• •••• •••• 4242',
    last4: '4242',
    cardholderName: 'ALICE EXAMPLE',
    expiryMonth: 6,
    expiryYear: 2029,
    currency: 'USD',
    ledgerBalanceMinor: 125000,
    availableBalanceMinor: 120000,
    status: 'ACTIVE',
    type: 'VIRTUAL',
    createdAt: '2026-01-15T10:00:00.000Z',
  };

  it('accepts a valid card', () => {
    expect(CardSchema.parse(valid)).toEqual(valid);
  });

  it('rejects last4 that is not exactly 4 chars', () => {
    expect(() => CardSchema.parse({ ...valid, last4: '42' })).toThrow();
    expect(() => CardSchema.parse({ ...valid, last4: '42424' })).toThrow();
  });

  it('rejects expiryMonth out of range', () => {
    expect(() => CardSchema.parse({ ...valid, expiryMonth: 0 })).toThrow();
    expect(() => CardSchema.parse({ ...valid, expiryMonth: 13 })).toThrow();
  });

  it('accepts negative ledger balance (overdraft possible in platform)', () => {
    expect(() => CardSchema.parse({ ...valid, ledgerBalanceMinor: -500 })).not.toThrow();
  });

  it('rejects non-integer balance', () => {
    expect(() => CardSchema.parse({ ...valid, ledgerBalanceMinor: 12.5 })).toThrow();
  });

  it('rejects invalid ISO date', () => {
    expect(() => CardSchema.parse({ ...valid, createdAt: '2026-01-15' })).toThrow();
  });
});
