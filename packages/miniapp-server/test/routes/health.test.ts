import { describe, expect, it } from 'vitest';
import { buildTestApp } from '../helpers/app.js';

describe('GET /api/health', () => {
  it('returns ok without initData', async () => {
    const { app, cleanup } = await buildTestApp();
    const r = await app.inject({ method: 'GET', url: '/api/health' });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.payload)).toEqual({ status: 'ok' });
    await cleanup();
  });
});
