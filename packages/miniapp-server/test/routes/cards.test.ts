import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
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
const initFor = (id: number) =>
  sign({
    user: JSON.stringify({ id, first_name: 'A' }),
    auth_date: String(Math.floor(Date.now() / 1000)),
  });

describe('GET /api/cards', () => {
  it('401 NOT_AUTHENTICATED without session', async () => {
    const { app, cleanup } = await buildTestApp();
    const r = await app.inject({
      method: 'GET',
      url: '/api/cards',
      headers: { 'x-telegram-init-data': initFor(42) },
    });
    expect(r.statusCode).toBe(401);
    expect(JSON.parse(r.payload).code).toBe('NOT_AUTHENTICATED');
    await cleanup();
  });
  it('200 proxies list when session present', async () => {
    const items = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        maskedPan: '**** **** **** 1111',
        last4: '1111',
        cardholderName: 'A',
        expiryMonth: 1,
        expiryYear: 2030,
        currency: 'USD' as const,
        ledgerBalanceMinor: 1,
        availableBalanceMinor: 1,
        status: 'ACTIVE' as const,
        type: 'VIRTUAL' as const,
        createdAt: new Date().toISOString(),
      },
    ];
    const { app, sessions, cleanup } = await buildTestApp({
      cardApi: { listCards: async () => ({ items, nextCursor: null }) } as never,
    });
    await sessions.set(42, {
      userId: 'u1',
      fullName: 'A',
      cardApiToken: 't',
      cardApiTokenExpiresAt: new Date(Date.now() + 3_600_000),
    });
    const r = await app.inject({
      method: 'GET',
      url: '/api/cards',
      headers: { 'x-telegram-init-data': initFor(42) },
    });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.payload).items[0].id).toBe('11111111-1111-1111-1111-111111111111');
    await cleanup();
  });
});
