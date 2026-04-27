import { describe, expect, it } from 'vitest';
import { CurrencySchema, DirectionSchema } from '../src/schemas/common.js';

describe('CurrencySchema', () => {
  it.each(['USD', 'EUR', 'GBP'])('accepts %s', (v) => {
    expect(CurrencySchema.parse(v)).toBe(v);
  });

  it.each(['usd', 'JPY', '', null, 123])('rejects %p', (v) => {
    expect(() => CurrencySchema.parse(v)).toThrow();
  });
});

describe('DirectionSchema', () => {
  it.each(['DEBIT', 'CREDIT'])('accepts %s', (v) => {
    expect(DirectionSchema.parse(v)).toBe(v);
  });

  it.each(['debit', 'OTHER', null])('rejects %p', (v) => {
    expect(() => DirectionSchema.parse(v)).toThrow();
  });
});
