import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';

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
    process.env.NODE_ENV = 'test';
    process.env.PORT = '4000';
    process.env.HOST = '127.0.0.1';
    process.env.LOG_LEVEL = 'info';
    process.env.DATABASE_URL = 'file:./x.db';
    process.env.JWT_SECRET = 'x'.repeat(32);
    process.env.JWT_EXPIRES_IN = '3600';
    const cfg = loadConfig();
    expect(cfg.port).toBe(4000);
    expect(cfg.jwtSecret.length).toBeGreaterThanOrEqual(32);
  });

  it('throws on short JWT_SECRET', () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'file:./x.db';
    process.env.JWT_SECRET = 'short';
    expect(() => loadConfig()).toThrow(/JWT_SECRET/);
  });

  it('throws on missing DATABASE_URL', () => {
    process.env.JWT_SECRET = 'x'.repeat(32);
    expect(() => loadConfig()).toThrow(/DATABASE_URL/);
  });
});
