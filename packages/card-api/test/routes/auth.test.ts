import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { hashPassword } from '../../src/auth/password.js';
import { type TestApp, buildTestApp } from '../helpers/app.js';

let t: TestApp;
beforeAll(async () => {
  t = await buildTestApp();
  const hash = await hashPassword('Passw0rd!');
  await t.db.prisma.user.create({
    data: { email: 'alice@example.com', passwordHash: hash, fullName: 'Alice' },
  });
});
afterAll(async () => {
  await t.cleanup();
});

describe('POST /v1/auth/login', () => {
  it('200 with valid creds returns token and user', async () => {
    const r = await t.app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'alice@example.com', password: 'Passw0rd!' },
    });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.payload);
    expect(body.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    expect(body.user.email).toBe('alice@example.com');
  });
  it('401 INVALID_CREDENTIALS on wrong password', async () => {
    const r = await t.app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'alice@example.com', password: 'nope' },
    });
    expect(r.statusCode).toBe(401);
    expect(JSON.parse(r.payload).code).toBe('INVALID_CREDENTIALS');
  });
  it('400 VALIDATION_FAILED on missing body', async () => {
    const r = await t.app.inject({ method: 'POST', url: '/v1/auth/login', payload: {} });
    expect(r.statusCode).toBe(400);
    expect(JSON.parse(r.payload).code).toBe('VALIDATION_FAILED');
  });
});
