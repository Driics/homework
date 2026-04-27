import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';

describe('loadConfig', () => {
  const original = { ...process.env };
  beforeEach(() => {
    for (const k of Object.keys(process.env)) delete process.env[k];
  });
  afterEach(() => {
    for (const k of Object.keys(process.env)) delete process.env[k];
    Object.assign(process.env, original);
  });

  it('parses valid env', () => {
    Object.assign(process.env, {
      NODE_ENV: 'test',
      PORT: '4000',
      HOST: '127.0.0.1',
      LOG_LEVEL: 'info',
      DATABASE_URL: 'file:./x.db',
      JWT_SECRET: 'x'.repeat(32),
      JWT_EXPIRES_IN: '3600',
    });
    const cfg = loadConfig();
    expect(cfg.port).toBe(4000);
    expect(cfg.jwtSecret.length).toBeGreaterThanOrEqual(32);
  });

  it('throws on short JWT_SECRET', () => {
    Object.assign(process.env, {
      NODE_ENV: 'test',
      DATABASE_URL: 'file:./x.db',
      JWT_SECRET: 'short',
    });
    expect(() => loadConfig()).toThrow(/JWT_SECRET/);
  });

  it('throws on missing DATABASE_URL', () => {
    Object.assign(process.env, { JWT_SECRET: 'x'.repeat(32) });
    expect(() => loadConfig()).toThrow(/DATABASE_URL/);
  });
});
