import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { buildTestApp } from '../helpers/app.js';

const BOT = '1:TESTBOT';
function sign(p: Record<string, string>): string {
  const s = createHmac('sha256', 'WebAppData').update(BOT).digest();
  const entries = Object.entries(p).sort(([a], [b]) => a.localeCompare(b));
  const hash = createHmac('sha256', s)
    .update(entries.map(([k, v]) => `${k}=${v}`).join('\n'))
    .digest('hex');
  return new URLSearchParams({ ...p, hash }).toString();
}

describe('GET /api/session', () => {
  it('401 MISSING_INIT_DATA without header', async () => {
    const { app, cleanup } = await buildTestApp();
    const r = await app.inject({ method: 'GET', url: '/api/session' });
    expect(r.statusCode).toBe(401);
    expect(JSON.parse(r.payload).code).toBe('MISSING_INIT_DATA');
    await cleanup();
  });
  it('returns authenticated:false when no session', async () => {
    const { app, cleanup } = await buildTestApp();
    const init = sign({
      user: JSON.stringify({ id: 42, first_name: 'A' }),
      auth_date: String(Math.floor(Date.now() / 1000)),
    });
    const r = await app.inject({
      method: 'GET',
      url: '/api/session',
      headers: { 'x-telegram-init-data': init },
    });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.payload)).toEqual({ authenticated: false });
    await cleanup();
  });
  it('returns authenticated:true with user when session exists', async () => {
    const { app, sessions, cleanup } = await buildTestApp();
    await sessions.set(42, {
      userId: 'u1',
      fullName: 'Alice',
      cardApiToken: 'tok',
      cardApiTokenExpiresAt: new Date(Date.now() + 60_000),
    });
    const init = sign({
      user: JSON.stringify({ id: 42, first_name: 'A' }),
      auth_date: String(Math.floor(Date.now() / 1000)),
    });
    const r = await app.inject({
      method: 'GET',
      url: '/api/session',
      headers: { 'x-telegram-init-data': init },
    });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.payload)).toEqual({ authenticated: true, user: { fullName: 'Alice' } });
    await cleanup();
  });
});
