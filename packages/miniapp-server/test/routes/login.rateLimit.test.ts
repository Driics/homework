import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { UnauthorizedError } from '../../src/errors.js';
import { buildTestApp } from '../helpers/app.js';

const BOT = '1:TESTBOT';
function sign(id: number) {
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
}

describe('login rate limit (per Telegram user)', () => {
  it('429 after 10 requests from same user in 1 minute', async () => {
    const { app, cleanup } = await buildTestApp({
      cardApi: {
        login: async () => {
          throw new UnauthorizedError('INVALID_CREDENTIALS', 'x');
        },
      } as never,
    });
    const init = sign(42);
    let last = 0;
    for (let i = 0; i < 12; i++) {
      const r = await app.inject({
        method: 'POST',
        url: '/api/login',
        headers: { 'x-telegram-init-data': init, 'content-type': 'application/json' },
        payload: JSON.stringify({ email: 'a@b.com', password: 'x' }),
      });
      last = r.statusCode;
    }
    expect(last).toBe(429);
    await cleanup();
  });
});
