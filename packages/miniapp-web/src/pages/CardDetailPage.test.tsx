import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installTelegramMock, uninstallTelegramMock } from '../../test/telegramMock.js';
import { CardDetailPage } from './CardDetailPage.js';

function renderAt(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/cards/:cardId" element={<CardDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const cardPayload = {
  id: '00000000-0000-0000-0000-000000000001',
  maskedPan: '•••• •••• •••• 4242',
  last4: '4242',
  cardholderName: 'ALICE EXAMPLE',
  expiryMonth: 6,
  expiryYear: 2029,
  currency: 'USD',
  ledgerBalanceMinor: 125000,
  availableBalanceMinor: 120000,
  status: 'ACTIVE',
  type: 'VIRTUAL',
  createdAt: '2026-01-15T10:00:00.000Z',
};

const activityPayload = {
  items: [
    {
      type: 'transaction',
      id: '00000000-0000-0000-0000-000000000020',
      cardId: cardPayload.id,
      authorizationId: null,
      amountMinor: 1299,
      direction: 'DEBIT',
      currency: 'USD',
      merchantName: 'Corner Coffee',
      merchantCategory: 'Dining',
      merchantCountry: 'US',
      merchantCity: 'Brooklyn',
      kind: 'PURCHASE',
      description: 'Coffee',
      postedAt: '2026-04-20T12:05:00.000Z',
    },
  ],
  nextCursor: null,
};

describe('CardDetailPage', () => {
  beforeEach(() => installTelegramMock());
  afterEach(() => {
    uninstallTelegramMock();
    vi.restoreAllMocks();
  });

  it('renders card balance and activity rows', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const u = String(url);
      if (u.endsWith(`/api/cards/${cardPayload.id}`)) {
        return new Response(JSON.stringify(cardPayload), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      if (u.includes('/activity')) {
        return new Response(JSON.stringify(activityPayload), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response('not found', { status: 404 });
    });
    renderAt(`/cards/${cardPayload.id}`);
    await waitFor(() => expect(screen.getByText('•••• •••• •••• 4242')).toBeInTheDocument());
    expect(screen.getByText('$1,200.00')).toBeInTheDocument();
    expect(screen.getByText('Corner Coffee')).toBeInTheDocument();
    expect(screen.getByText('−$12.99')).toBeInTheDocument();
  });

  it('toggles activity filter chip and refetches with ?type=transaction', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const u = String(url);
      if (u.endsWith(`/api/cards/${cardPayload.id}`)) {
        return new Response(JSON.stringify(cardPayload), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(activityPayload), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    renderAt(`/cards/${cardPayload.id}`);
    await screen.findByText('Corner Coffee');
    await userEvent.click(screen.getByRole('button', { name: /transactions only/i }));
    await waitFor(() => {
      const calledWithFilter = fetchSpy.mock.calls.some(([url]) =>
        String(url).includes('/activity?type=transaction'),
      );
      expect(calledWithFilter).toBe(true);
    });
  });
});
