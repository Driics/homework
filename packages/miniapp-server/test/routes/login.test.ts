import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { UnauthorizedError } from '../../src/errors.js';
import { buildTestApp } from '../helpers/app.js';

const BOT = '1:TESTBOT';
function sign(p: Record<string, string>) {
  const s = createHmac('sha256', 'WebAppData').update(BOT).digest();
  const entries = Object.entries(p).sort(([a], [b]) => a.localeCompare(b));
  const hash = createHmac('sha256', s)
    .update(entries.map(([k, v]) => `${k}=${v}`).join('\n'))
    .digest('hex');
  return new URLSearchParams({ ...p, hash }).toString();
}

describe('POST /api/login', () => {
  it('200 creates a session on card-api success', async () => {
    const user = { id: 'u1', email: 'a@x.com', fullName: 'Alice' };
    const expiresAt = new Date(Date.now() + 60_000).toISOString();
    const { app, sessions, cleanup } = await buildTestApp({
      cardApi: { login: async () => ({ token: 't', expiresAt, user }) } as never,
    });
    const init = sign({
      user: JSON.stringify({ id: 42, first_name: 'A' }),
      auth_date: String(Math.floor(Date.now() / 1000)),
    });
    const r = await app.inject({
      method: 'POST',
      url: '/api/login',
      headers: { 'x-telegram-init-data': init, 'content-type': 'application/json' },
      payload: JSON.stringify({ email: 'a@x.com', password: 'Passw0rd!' }),
    });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.payload)).toEqual({ user: { fullName: 'Alice' } });
    expect(await sessions.get(42)).toMatchObject({ userId: 'u1', cardApiToken: 't' });
    await cleanup();
  });

  it('401 INVALID_CREDENTIALS passes through', async () => {
    const { app, sessions, cleanup } = await buildTestApp({
      cardApi: {
        login: async () => {
          throw new UnauthorizedError('INVALID_CREDENTIALS', 'bad');
        },
      } as never,
    });
    const init = sign({
      user: JSON.stringify({ id: 42, first_name: 'A' }),
      auth_date: String(Math.floor(Date.now() / 1000)),
    });
    const r = await app.inject({
      method: 'POST',
      url: '/api/login',
      headers: { 'x-telegram-init-data': init, 'content-type': 'application/json' },
      payload: JSON.stringify({ email: 'a@x.com', password: 'wrong' }),
    });
    expect(r.statusCode).toBe(401);
    expect(JSON.parse(r.payload).code).toBe('INVALID_CREDENTIALS');
    expect(await sessions.get(42)).toBeNull();
    await cleanup();
  });
});

describe('POST /api/logout', () => {
  it('204 and deletes session', async () => {
    const { app, sessions, cleanup } = await buildTestApp();
    await sessions.set(42, {
      userId: 'u1',
      fullName: 'A',
      cardApiToken: 't',
      cardApiTokenExpiresAt: new Date(Date.now() + 60_000),
    });
    const init = sign({
      user: JSON.stringify({ id: 42, first_name: 'A' }),
      auth_date: String(Math.floor(Date.now() / 1000)),
    });
    const r = await app.inject({
      method: 'POST',
      url: '/api/logout',
      headers: { 'x-telegram-init-data': init },
    });
    expect(r.statusCode).toBe(204);
    expect(await sessions.get(42)).toBeNull();
    await cleanup();
  });
});
