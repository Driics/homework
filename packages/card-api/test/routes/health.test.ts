import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type TestApp, buildTestApp } from '../helpers/app.js';

let t: TestApp;
beforeAll(async () => {
  t = await buildTestApp();
});
afterAll(async () => {
  await t.cleanup();
});

describe('GET /v1/health', () => {
  it('returns { status: "ok" }', async () => {
    const r = await t.app.inject({ method: 'GET', url: '/v1/health' });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.payload)).toEqual({ status: 'ok' });
  });
});
