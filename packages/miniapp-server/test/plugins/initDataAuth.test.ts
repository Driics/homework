import { createHmac } from 'node:crypto';
import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { errorHandlerPlugin } from '../../src/plugins/errorHandler.js';
import { initDataAuthPlugin } from '../../src/plugins/initDataAuth.js';
import { requestIdPlugin } from '../../src/plugins/requestId.js';

const BOT_TOKEN = '1:TESTBOT';

function sign(payload: Record<string, string>): string {
  const secret = createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const entries = Object.entries(payload).sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');
  const hash = createHmac('sha256', secret).update(dataCheckString).digest('hex');
  return new URLSearchParams({ ...payload, hash }).toString();
}

async function buildApp() {
  const app = Fastify();
  await app.register(requestIdPlugin);
  await app.register(errorHandlerPlugin);
  await app.register(initDataAuthPlugin, { botToken: BOT_TOKEN, maxAgeSeconds: 3600 });
  app.get('/api/ping', { preHandler: [app.verifyInitData] }, async (req) => ({
    userId: req.telegramUser.id,
  }));
  app.get('/api/health', async () => ({ ok: true }));
  return app;
}

describe('initDataAuthPlugin', () => {
  it('401 MISSING_INIT_DATA without header', async () => {
    const app = await buildApp();
    const r = await app.inject({ method: 'GET', url: '/api/ping' });
    expect(r.statusCode).toBe(401);
    expect(JSON.parse(r.payload).code).toBe('MISSING_INIT_DATA');
    await app.close();
  });
  it('401 INVALID_INIT_DATA on tampered header', async () => {
    const app = await buildApp();
    const r = await app.inject({
      method: 'GET',
      url: '/api/ping',
      headers: { 'x-telegram-init-data': 'user=xyz&auth_date=1&hash=bad' },
    });
    expect(r.statusCode).toBe(401);
    expect(JSON.parse(r.payload).code).toBe('INVALID_INIT_DATA');
    await app.close();
  });
  it('401 STALE_INIT_DATA on old auth_date', async () => {
    const app = await buildApp();
    const stale = sign({
      user: JSON.stringify({ id: 42, first_name: 'A' }),
      auth_date: String(Math.floor(Date.now() / 1000) - 7200),
    });
    const r = await app.inject({
      method: 'GET',
      url: '/api/ping',
      headers: { 'x-telegram-init-data': stale },
    });
    expect(r.statusCode).toBe(401);
    expect(JSON.parse(r.payload).code).toBe('STALE_INIT_DATA');
    await app.close();
  });
  it('200 with valid initData; attaches telegramUser', async () => {
    const app = await buildApp();
    const ok = sign({
      user: JSON.stringify({ id: 42, first_name: 'A' }),
      auth_date: String(Math.floor(Date.now() / 1000)),
    });
    const r = await app.inject({
      method: 'GET',
      url: '/api/ping',
      headers: { 'x-telegram-init-data': ok },
    });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.payload).userId).toBe(42);
    await app.close();
  });
});
