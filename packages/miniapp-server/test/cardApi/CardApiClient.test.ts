import { MockAgent, getGlobalDispatcher, setGlobalDispatcher } from 'undici';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CardApiClient } from '../../src/cardApi/CardApiClient.js';
import { BadGatewayError, UnauthorizedError } from '../../src/errors.js';

describe('CardApiClient', () => {
  const baseUrl = 'http://card-api.test';
  let mock: MockAgent;
  let original: ReturnType<typeof getGlobalDispatcher>;

  beforeEach(() => {
    original = getGlobalDispatcher();
    mock = new MockAgent();
    mock.disableNetConnect();
    setGlobalDispatcher(mock);
  });
  afterEach(async () => {
    await mock.close();
    setGlobalDispatcher(original);
  });

  it('login returns parsed body on 200', async () => {
    mock
      .get(baseUrl)
      .intercept({ path: '/v1/auth/login', method: 'POST' })
      .reply(200, {
        token: 't',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        user: { id: '11111111-1111-1111-1111-111111111111', email: 'a@b.com', fullName: 'A' },
      });

    const c = new CardApiClient({ baseUrl, timeoutMs: 2000 });
    const r = await c.login({ email: 'a@b.com', password: 'x' });
    expect(r.token).toBe('t');
  });

  it('login 401 → UnauthorizedError(INVALID_CREDENTIALS)', async () => {
    mock.get(baseUrl).intercept({ path: '/v1/auth/login', method: 'POST' }).reply(401, {
      code: 'INVALID_CREDENTIALS',
      message: 'bad',
      requestId: '00000000-0000-0000-0000-000000000000',
    });
    const c = new CardApiClient({ baseUrl, timeoutMs: 2000 });
    await expect(c.login({ email: 'a@b.com', password: 'x' })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it('listCards with expired token → UnauthorizedError(SESSION_EXPIRED)', async () => {
    mock.get(baseUrl).intercept({ path: '/v1/cards', method: 'GET' }).reply(401, {
      code: 'TOKEN_EXPIRED',
      message: 'expired',
      requestId: '00000000-0000-0000-0000-000000000000',
    });
    const c = new CardApiClient({ baseUrl, timeoutMs: 2000 });
    await expect(c.listCards('bad-token')).rejects.toMatchObject({ code: 'SESSION_EXPIRED' });
  });

  it('5xx → BadGatewayError(UPSTREAM_UNAVAILABLE)', async () => {
    mock
      .get(baseUrl)
      .intercept({ path: '/v1/cards', method: 'GET' })
      .reply(500, { code: 'INTERNAL', message: 'oops', requestId: 'r' });
    const c = new CardApiClient({ baseUrl, timeoutMs: 2000 });
    await expect(c.listCards('t')).rejects.toBeInstanceOf(BadGatewayError);
  });

  it('parses card list against shared schema (defense in depth)', async () => {
    mock
      .get(baseUrl)
      .intercept({ path: '/v1/cards', method: 'GET' })
      .reply(200, {
        items: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            maskedPan: '****1111',
            last4: '1111',
            cardholderName: 'Alice',
            expiryMonth: 12,
            expiryYear: 2030,
            currency: 'USD',
            ledgerBalanceMinor: 100,
            availableBalanceMinor: 100,
            status: 'ACTIVE',
            type: 'VIRTUAL',
            createdAt: new Date().toISOString(),
          },
        ],
        nextCursor: null,
      });
    const c = new CardApiClient({ baseUrl, timeoutMs: 2000 });
    const r = await c.listCards('t');
    expect(r.items[0]?.last4).toBe('1111');
  });
});
