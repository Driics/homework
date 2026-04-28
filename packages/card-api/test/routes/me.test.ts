import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { signToken } from '../../src/auth/jwt.js';
import { hashPassword } from '../../src/auth/password.js';
import { type TestApp, buildTestApp } from '../helpers/app.js';

let t: TestApp;
let aliceToken: string;
beforeAll(async () => {
  t = await buildTestApp();
  const hash = await hashPassword('x');
  const alice = await t.db.prisma.user.create({
    data: { email: 'a@x.com', passwordHash: hash, fullName: 'Alice' },
  });
  const tok = await signToken({ sub: alice.id, email: alice.email }, 'x'.repeat(32), 60);
  aliceToken = tok.token;
});
afterAll(async () => {
  await t.cleanup();
});

describe('GET /v1/me', () => {
  it('401 without token', async () => {
    const r = await t.app.inject({ method: 'GET', url: '/v1/me' });
    expect(r.statusCode).toBe(401);
    expect(JSON.parse(r.payload).code).toBe('MISSING_TOKEN');
  });
  it('200 with token', async () => {
    const r = await t.app.inject({
      method: 'GET',
      url: '/v1/me',
      headers: { authorization: `Bearer ${aliceToken}` },
    });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.payload).email).toBe('a@x.com');
  });
});
