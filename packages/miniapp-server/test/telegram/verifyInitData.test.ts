import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  InvalidInitDataError,
  StaleInitDataError,
  verifyInitData,
} from '../../src/telegram/verifyInitData.js';

const BOT_TOKEN = '12345:TESTTESTTESTTEST';
const MAX_AGE = 24 * 60 * 60;

function signInitData(payload: Record<string, string>, botToken: string): string {
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const entries = Object.entries(payload)
    .filter(([k]) => k !== 'hash')
    .sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');
  const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  const params = new URLSearchParams({ ...payload, hash });
  return params.toString();
}

describe('verifyInitData', () => {
  const user = { id: 42, first_name: 'Alice', last_name: 'A', username: 'alice' };
  const authDate = String(Math.floor(Date.now() / 1000) - 60);

  it('accepts valid HMAC', () => {
    const initData = signInitData(
      { user: JSON.stringify(user), auth_date: authDate, query_id: 'q1' },
      BOT_TOKEN,
    );
    const r = verifyInitData(initData, BOT_TOKEN, MAX_AGE);
    expect(r.user.id).toBe(42);
    expect(r.authDate.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('rejects tampered payload', () => {
    const initData = signInitData({ user: JSON.stringify(user), auth_date: authDate }, BOT_TOKEN);
    const tampered = initData.replace('id%22%3A42', 'id%22%3A99');
    expect(() => verifyInitData(tampered, BOT_TOKEN, MAX_AGE)).toThrow(InvalidInitDataError);
  });

  it('rejects wrong bot token', () => {
    const initData = signInitData({ user: JSON.stringify(user), auth_date: authDate }, BOT_TOKEN);
    expect(() => verifyInitData(initData, 'other:token', MAX_AGE)).toThrow(InvalidInitDataError);
  });

  it('rejects stale auth_date (> maxAge)', () => {
    const stale = String(Math.floor(Date.now() / 1000) - 25 * 60 * 60);
    const initData = signInitData({ user: JSON.stringify(user), auth_date: stale }, BOT_TOKEN);
    expect(() => verifyInitData(initData, BOT_TOKEN, MAX_AGE)).toThrow(StaleInitDataError);
  });

  it('rejects missing hash', () => {
    const raw = new URLSearchParams({ user: JSON.stringify(user), auth_date: authDate }).toString();
    expect(() => verifyInitData(raw, BOT_TOKEN, MAX_AGE)).toThrow(InvalidInitDataError);
  });

  it('rejects missing user field', () => {
    const initData = signInitData({ auth_date: authDate }, BOT_TOKEN);
    expect(() => verifyInitData(initData, BOT_TOKEN, MAX_AGE)).toThrow(InvalidInitDataError);
  });

  it('rejects malformed user JSON', () => {
    const initData = signInitData({ user: 'not-json', auth_date: authDate }, BOT_TOKEN);
    expect(() => verifyInitData(initData, BOT_TOKEN, MAX_AGE)).toThrow(InvalidInitDataError);
  });

  it('is timing-safe against partial hash prefix', () => {
    const initData = signInitData({ user: JSON.stringify(user), auth_date: authDate }, BOT_TOKEN);
    const params = new URLSearchParams(initData);
    const real = params.get('hash') ?? '';
    params.set('hash', `${real.slice(0, -2)}00`);
    expect(() => verifyInitData(params.toString(), BOT_TOKEN, MAX_AGE)).toThrow(
      InvalidInitDataError,
    );
  });
});
