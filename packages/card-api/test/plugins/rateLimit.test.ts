import { describe, expect, it } from 'vitest';
import { type TestApp, buildTestApp } from '../helpers/app.js';

describe('rate limit on /v1/auth/login', () => {
  it('trips after threshold with 429', async () => {
    const t: TestApp = await buildTestApp();
    const body = { email: 'nope@x.com', password: 'x' };
    let last = 0;
    for (let i = 0; i < 12; i++) {
      const r = await t.app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: body,
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });
      last = r.statusCode;
    }
    expect(last).toBe(429);
    await t.cleanup();
  });
});
