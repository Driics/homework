import { describe, expect, it } from 'vitest';
import { signToken, verifyToken } from '../../src/auth/jwt.js';

const secret = 'x'.repeat(32);

describe('jwt', () => {
  it('signs and verifies round-trip', async () => {
    const { token, expiresAt } = await signToken({ sub: 'user-1', email: 'a@b.com' }, secret, 60);
    expect(token.split('.').length).toBe(3);
    const payload = await verifyToken(token, secret);
    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('a@b.com');
    expect(expiresAt).toBeInstanceOf(Date);
  });
  it('rejects tampered token', async () => {
    const { token } = await signToken({ sub: 'u', email: 'a@b.com' }, secret, 60);
    const tampered = `${token.slice(0, -4)}AAAA`;
    await expect(verifyToken(tampered, secret)).rejects.toThrow();
  });
  it('rejects expired token', async () => {
    const { token } = await signToken({ sub: 'u', email: 'a@b.com' }, secret, -1);
    await expect(verifyToken(token, secret)).rejects.toThrow();
  });
});
