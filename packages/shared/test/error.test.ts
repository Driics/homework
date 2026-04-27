import { describe, expect, it } from 'vitest';
import {
  CARD_API_ERROR_CODES,
  ErrorResponseSchema,
  MINIAPP_ERROR_CODES,
} from '../src/schemas/error.js';

describe('ErrorResponseSchema', () => {
  it('accepts a valid error', () => {
    const e = {
      code: 'INVALID_CREDENTIALS',
      message: 'Email or password is incorrect',
      requestId: '550e8400-e29b-41d4-a716-446655440099',
    };
    expect(ErrorResponseSchema.parse(e)).toEqual(e);
  });

  it('accepts optional details', () => {
    const e = {
      code: 'VALIDATION_FAILED',
      message: 'Invalid input',
      details: { field: 'email', issue: 'required' },
      requestId: '550e8400-e29b-41d4-a716-446655440099',
    };
    expect(ErrorResponseSchema.parse(e)).toEqual(e);
  });

  it('rejects missing requestId', () => {
    expect(() => ErrorResponseSchema.parse({ code: 'X', message: 'Y' })).toThrow();
  });
});

describe('error code constants', () => {
  it('exposes Card API codes', () => {
    expect(CARD_API_ERROR_CODES.INVALID_CREDENTIALS).toBe('INVALID_CREDENTIALS');
    expect(CARD_API_ERROR_CODES.CARD_NOT_FOUND).toBe('CARD_NOT_FOUND');
  });

  it('exposes miniapp codes', () => {
    expect(MINIAPP_ERROR_CODES.INVALID_INIT_DATA).toBe('INVALID_INIT_DATA');
    expect(MINIAPP_ERROR_CODES.SESSION_EXPIRED).toBe('SESSION_EXPIRED');
  });
});
