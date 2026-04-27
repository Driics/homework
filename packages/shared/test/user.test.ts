import { describe, expect, it } from 'vitest';
import { UserPublicSchema } from '../src/schemas/user.js';

describe('UserPublicSchema', () => {
  const valid = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'alice@example.com',
    fullName: 'Alice Example',
  };

  it('accepts a valid user', () => {
    expect(UserPublicSchema.parse(valid)).toEqual(valid);
  });

  it('rejects non-uuid id', () => {
    expect(() => UserPublicSchema.parse({ ...valid, id: 'abc' })).toThrow();
  });

  it('rejects invalid email', () => {
    expect(() => UserPublicSchema.parse({ ...valid, email: 'not-an-email' })).toThrow();
  });

  it('rejects empty fullName', () => {
    expect(() => UserPublicSchema.parse({ ...valid, fullName: '' })).toThrow();
  });

  it('rejects extra fields in strict mode when using .strict()', () => {
    expect(() => UserPublicSchema.strict().parse({ ...valid, passwordHash: 'leak' })).toThrow();
  });
});
