import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installTelegramMock, uninstallTelegramMock } from '../../test/telegramMock.js';
import { CardListPage } from './CardListPage.js';

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <CardListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const card = (id: string, last4: string, status = 'ACTIVE') => ({
  id,
  maskedPan: `•••• ${last4}`,
  last4,
  cardholderName: 'A',
  expiryMonth: 1,
  expiryYear: 2030,
  currency: 'USD',
  ledgerBalanceMinor: 100,
  availableBalanceMinor: 100,
  status,
  type: 'VIRTUAL',
  createdAt: '2026-01-01T00:00:00.000Z',
});

describe('CardListPage', () => {
  beforeEach(() => installTelegramMock());
  afterEach(() => {
    uninstallTelegramMock();
    vi.restoreAllMocks();
  });

  it('renders all cards from /api/cards', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [card('a', '1111'), card('b', '2222', 'FROZEN')],
          nextCursor: null,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('•••• 1111')).toBeInTheDocument());
    expect(screen.getByText('•••• 2222')).toBeInTheDocument();
    expect(screen.getByText('FROZEN')).toBeInTheDocument();
  });

  it('renders empty state when no cards', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ items: [], nextCursor: null }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    renderPage();
    expect(await screen.findByText(/No cards yet/)).toBeInTheDocument();
  });

  it('logout button POSTs /api/logout', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const u = String(url);
      if (u.endsWith('/api/cards')) {
        return new Response(JSON.stringify({ items: [], nextCursor: null }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      if (u.endsWith('/api/session')) {
        return new Response(JSON.stringify({ authenticated: true, user: { fullName: 'A' } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(null, { status: 204 });
    });
    renderPage();
    await screen.findByText(/No cards yet/);
    await userEvent.click(screen.getByRole('button', { name: /log out/i }));
    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/logout',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });
});
