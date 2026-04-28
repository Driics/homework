import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type TestApp, buildTestApp } from '../helpers/app.js';

let t: TestApp;
beforeAll(async () => {
  t = await buildTestApp();
});
afterAll(async () => {
  await t.cleanup();
});

describe('OpenAPI', () => {
  it('serves valid JSON at /documentation/json in non-prod', async () => {
    const r = await t.app.inject({ method: 'GET', url: '/documentation/json' });
    expect(r.statusCode).toBe(200);
    const doc = JSON.parse(r.payload);
    expect(doc.openapi).toBeTypeOf('string');
    expect(doc.paths['/v1/health']).toBeDefined();
    await t.cleanup();
  });
});
