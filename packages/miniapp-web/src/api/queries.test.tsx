import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installTelegramMock, uninstallTelegramMock } from '../../test/telegramMock.js';
import { useCard, useCards, useSession } from './queries.js';

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('queries', () => {
  beforeEach(() => installTelegramMock());
  afterEach(() => {
    uninstallTelegramMock();
    vi.restoreAllMocks();
  });

  it('useCards fetches /api/cards', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ items: [], nextCursor: null }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const { result } = renderHook(() => useCards(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toEqual([]);
  });

  it('useCard fetches /api/cards/:id', async () => {
    const card = {
      id: '00000000-0000-0000-0000-000000000001',
      maskedPan: '•••• 4242',
      last4: '4242',
      cardholderName: 'X',
      expiryMonth: 1,
      expiryYear: 2030,
      currency: 'USD',
      ledgerBalanceMinor: 100,
      availableBalanceMinor: 100,
      status: 'ACTIVE',
      type: 'VIRTUAL',
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(card), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const { result } = renderHook(() => useCard(card.id), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.last4).toBe('4242');
  });

  it('useSession returns { authenticated: false } when no session exists', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ authenticated: false }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const { result } = renderHook(() => useSession(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ authenticated: false });
  });

  it('useSession returns { authenticated: true, user } when a session exists', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ authenticated: true, user: { fullName: 'Alice' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const { result } = renderHook(() => useSession(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ authenticated: true, user: { fullName: 'Alice' } });
  });
});
