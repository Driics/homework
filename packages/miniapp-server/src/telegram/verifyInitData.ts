import { createHmac, timingSafeEqual } from 'node:crypto';

export class InvalidInitDataError extends Error {
  constructor(msg = 'Invalid initData') {
    super(msg);
  }
}
export class StaleInitDataError extends Error {
  constructor(msg = 'Stale initData') {
    super(msg);
  }
}

export type TelegramUser = {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
};

export type VerifiedInitData = {
  user: TelegramUser;
  authDate: Date;
  queryId: string | null;
};

export function verifyInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds: number,
  now: Date = new Date(),
): VerifiedInitData {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) throw new InvalidInitDataError('Missing hash');

  const entries: Array<[string, string]> = [];
  for (const [k, v] of params.entries()) if (k !== 'hash') entries.push([k, v]);
  entries.sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expected = createHmac('sha256', secretKey).update(dataCheckString).digest();
  const actual = Buffer.from(hash, 'hex');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new InvalidInitDataError('Hash mismatch');
  }

  const userRaw = params.get('user');
  if (!userRaw) throw new InvalidInitDataError('Missing user');
  type RawUser = {
    id?: unknown;
    first_name?: unknown;
    last_name?: unknown;
    username?: unknown;
    language_code?: unknown;
  };
  let parsed: RawUser;
  try {
    parsed = JSON.parse(userRaw) as RawUser;
  } catch {
    throw new InvalidInitDataError('Malformed user');
  }
  if (typeof parsed.id !== 'number' || typeof parsed.first_name !== 'string') {
    throw new InvalidInitDataError('Invalid user fields');
  }

  const authDateRaw = params.get('auth_date');
  if (!authDateRaw) throw new InvalidInitDataError('Missing auth_date');
  const authDateSec = Number.parseInt(authDateRaw, 10);
  if (!Number.isFinite(authDateSec)) throw new InvalidInitDataError('Invalid auth_date');
  const authDate = new Date(authDateSec * 1000);
  if ((now.getTime() - authDate.getTime()) / 1000 > maxAgeSeconds) {
    throw new StaleInitDataError();
  }

  const user: TelegramUser = {
    id: parsed.id as number,
    firstName: parsed.first_name as string,
    ...(typeof parsed.last_name === 'string' ? { lastName: parsed.last_name } : {}),
    ...(typeof parsed.username === 'string' ? { username: parsed.username } : {}),
    ...(typeof parsed.language_code === 'string' ? { languageCode: parsed.language_code } : {}),
  };
  return { user, authDate, queryId: params.get('query_id') };
}
