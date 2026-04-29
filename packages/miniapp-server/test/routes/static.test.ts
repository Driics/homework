import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildTestApp } from '../helpers/app.js';

describe('SPA fallback', () => {
  const dir = path.resolve('./.tmp/static-test');
  it('serves index.html for unknown non-/api paths', async () => {
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'index.html'), '<html>hi</html>', 'utf8');
    const { app, cleanup } = await buildTestApp({ config: { staticDir: dir }, serveStatic: true });
    try {
      const r = await app.inject({ method: 'GET', url: '/some/spa/route' });
      expect(r.statusCode).toBe(200);
      expect(r.payload).toContain('hi');
    } finally {
      await cleanup();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
