import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installTelegramMock, uninstallTelegramMock } from '../test/telegramMock.js';
import { AppRoutes } from './App.js';

function renderAt(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AppRoutes', () => {
  beforeEach(() => installTelegramMock());
  afterEach(() => {
    uninstallTelegramMock();
    vi.restoreAllMocks();
  });

  it('redirects unauthenticated user from /cards to /login', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ authenticated: false }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    renderAt('/cards');
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument(),
    );
  });

  it('keeps authenticated user on /cards', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const u = String(url);
      if (u.endsWith('/api/session')) {
        return new Response(JSON.stringify({ authenticated: true, user: { fullName: 'A' } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ items: [], nextCursor: null }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    renderAt('/cards');
    await waitFor(() => expect(screen.getByText(/Your cards/)).toBeInTheDocument());
  });
});
