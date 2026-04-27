import { describe, expect, it } from 'vitest';
import { LoginRequestSchema, LoginResponseSchema } from '../src/schemas/auth.js';

describe('LoginRequestSchema', () => {
  it('accepts valid credentials', () => {
    expect(LoginRequestSchema.parse({ email: 'alice@example.com', password: 'hunter2' })).toEqual({
      email: 'alice@example.com',
      password: 'hunter2',
    });
  });

  it('rejects bad email', () => {
    expect(() => LoginRequestSchema.parse({ email: 'not-email', password: 'x' })).toThrow();
  });

  it('rejects empty password', () => {
    expect(() => LoginRequestSchema.parse({ email: 'alice@example.com', password: '' })).toThrow();
  });
});

describe('LoginResponseSchema', () => {
  it('accepts valid response', () => {
    const res = {
      token: 'eyJhbGci...',
      expiresAt: '2026-04-20T13:00:00.000Z',
      user: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'alice@example.com',
        fullName: 'Alice',
      },
    };
    expect(LoginResponseSchema.parse(res)).toEqual(res);
  });
});
