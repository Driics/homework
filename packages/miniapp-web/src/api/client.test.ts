import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installTelegramMock, uninstallTelegramMock } from '../../test/telegramMock.js';
import { ApiError, apiFetch } from './client.js';

describe('apiFetch', () => {
  beforeEach(() => installTelegramMock('query_id=Q&user=%7B%22id%22%3A42%7D&hash=deadbeef'));
  afterEach(() => {
    uninstallTelegramMock();
    vi.restoreAllMocks();
  });

  it('attaches X-Telegram-Init-Data header', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    await apiFetch('/api/cards');
    const init = fetchSpy.mock.calls[0]?.[1];
    expect((init?.headers as Record<string, string>)['X-Telegram-Init-Data']).toBe(
      'query_id=Q&user=%7B%22id%22%3A42%7D&hash=deadbeef',
    );
  });

  it('returns parsed JSON on 200', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ value: 5 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const data = await apiFetch<{ value: number }>('/api/cards');
    expect(data.value).toBe(5);
  });

  it('throws ApiError with code/message/status on JSON error response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ code: 'CARD_NOT_FOUND', message: 'Card not found', requestId: 'r1' }),
        {
          status: 404,
          headers: { 'content-type': 'application/json' },
        },
      ),
    );
    const err = await apiFetch('/api/cards/x').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(404);
    expect((err as ApiError).code).toBe('CARD_NOT_FOUND');
  });

  it('throws ApiError with INTERNAL fallback on non-JSON 500', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('boom', { status: 500, headers: { 'content-type': 'text/plain' } }),
    );
    const err = await apiFetch('/api/cards').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe('INTERNAL');
    expect((err as ApiError).status).toBe(500);
  });

  it('serializes JSON body and sets content-type', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    await apiFetch('/api/login', { method: 'POST', body: { email: 'a@b', password: 'p' } });
    const init = fetchSpy.mock.calls[0]?.[1];
    expect(init?.method).toBe('POST');
    expect((init?.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(init?.body).toBe('{"email":"a@b","password":"p"}');
  });
});
