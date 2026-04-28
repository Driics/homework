import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';

describe('loadConfig', () => {
  const orig = { ...process.env };
  beforeEach(() => {
    for (const k of Object.keys(process.env)) delete process.env[k];
  });
  afterEach(() => {
    for (const k of Object.keys(process.env)) delete process.env[k];
    Object.assign(process.env, orig);
  });

  it('parses valid env', () => {
    process.env.NODE_ENV = 'test';
    process.env.TELEGRAM_BOT_TOKEN = '111:abcdef';
    process.env.MINIAPP_PUBLIC_URL = 'https://example.ngrok.app';
    process.env.CARD_API_URL = 'http://localhost:4000';
    const cfg = loadConfig();
    expect(cfg.telegramBotToken).toBe('111:abcdef');
    expect(cfg.botMode).toBe('polling');
  });
  it('requires bot token', () => {
    expect(() => loadConfig()).toThrow(/TELEGRAM_BOT_TOKEN/);
  });
  it('validates BOT_MODE enum', () => {
    process.env.TELEGRAM_BOT_TOKEN = '1:a';
    process.env.MINIAPP_PUBLIC_URL = 'https://x.y';
    process.env.CARD_API_URL = 'http://x';
    process.env.BOT_MODE = 'carrier-pigeon';
    expect(() => loadConfig()).toThrow(/BOT_MODE/);
  });
});
