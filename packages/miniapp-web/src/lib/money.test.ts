import { describe, expect, it } from 'vitest';
import { formatMoney, formatSignedMoney } from './money.js';

describe('formatMoney', () => {
  it('formats USD whole units', () => {
    expect(formatMoney(125000, 'USD')).toBe('$1,250.00');
  });
  it('formats EUR with EUR symbol', () => {
    expect(formatMoney(99, 'EUR')).toMatch(/€/);
  });
  it('formats GBP', () => {
    expect(formatMoney(100, 'GBP')).toMatch(/£/);
  });
  it('handles zero', () => {
    expect(formatMoney(0, 'USD')).toBe('$0.00');
  });
  it('handles negative balance (overdraft)', () => {
    expect(formatMoney(-500, 'USD')).toBe('-$5.00');
  });
});

describe('formatSignedMoney', () => {
  it('prefixes minus on DEBIT', () => {
    expect(formatSignedMoney(1299, 'USD', 'DEBIT')).toBe('−$12.99');
  });
  it('prefixes plus on CREDIT', () => {
    expect(formatSignedMoney(500, 'USD', 'CREDIT')).toBe('+$5.00');
  });
});
