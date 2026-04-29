import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { buildTestApp } from './helpers/app.js';

const BOT = '1:TESTBOT';
const signInit = (id: number) => {
  const secret = createHmac('sha256', 'WebAppData').update(BOT).digest();
  const payload = {
    user: JSON.stringify({ id, first_name: 'A' }),
    auth_date: String(Math.floor(Date.now() / 1000)),
  };
  const entries = Object.entries(payload).sort(([a], [b]) => a.localeCompare(b));
  const hash = createHmac('sha256', secret)
    .update(entries.map(([k, v]) => `${k}=${v}`).join('\n'))
    .digest('hex');
  return new URLSearchParams({ ...payload, hash }).toString();
};

describe('session lifecycle', () => {
  it('login → session true → cards → logout → session false', async () => {
    const user = { id: 'u1', email: 'a@b.com', fullName: 'Alice' };
    const expiresAt = new Date(Date.now() + 3_600_000).toISOString();
    const { app, cleanup } = await buildTestApp({
      cardApi: {
        login: async () => ({ token: 't', expiresAt, user }),
        listCards: async () => ({ items: [], nextCursor: null }),
      } as never,
    });
    const h = { 'x-telegram-init-data': signInit(42), 'content-type': 'application/json' };

    let r = await app.inject({ method: 'GET', url: '/api/session', headers: h });
    expect(JSON.parse(r.payload)).toEqual({ authenticated: false });

    r = await app.inject({
      method: 'POST',
      url: '/api/login',
      headers: h,
      payload: JSON.stringify({ email: 'a@b.com', password: 'Passw0rd!' }),
    });
    expect(r.statusCode).toBe(200);

    r = await app.inject({ method: 'GET', url: '/api/session', headers: h });
    expect(JSON.parse(r.payload)).toEqual({ authenticated: true, user: { fullName: 'Alice' } });

    r = await app.inject({ method: 'GET', url: '/api/cards', headers: h });
    expect(r.statusCode).toBe(200);

    r = await app.inject({ method: 'POST', url: '/api/logout', headers: h });
    expect(r.statusCode).toBe(204);

    r = await app.inject({ method: 'GET', url: '/api/session', headers: h });
    expect(JSON.parse(r.payload)).toEqual({ authenticated: false });

    await cleanup();
  });
});
