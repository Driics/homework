import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/auth/password.js';

describe('password', () => {
  it('hashes and verifies round-trip', async () => {
    const hash = await hashPassword('Passw0rd!');
    expect(hash).not.toBe('Passw0rd!');
    expect(await verifyPassword('Passw0rd!', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });
  it('hashes the same input to different hashes (salt)', async () => {
    const a = await hashPassword('x');
    const b = await hashPassword('x');
    expect(a).not.toBe(b);
  });
});
