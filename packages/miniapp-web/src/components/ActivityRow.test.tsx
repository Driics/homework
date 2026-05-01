import type { ActivityItem } from '@homework/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ActivityRow } from './ActivityRow.js';

const tx: ActivityItem = {
  type: 'transaction',
  id: '00000000-0000-0000-0000-000000000020',
  cardId: '00000000-0000-0000-0000-000000000001',
  authorizationId: null,
  amountMinor: 1299,
  direction: 'DEBIT',
  currency: 'USD',
  merchantName: 'Corner Coffee',
  merchantCategory: 'Dining',
  merchantCountry: 'US',
  merchantCity: 'Brooklyn',
  kind: 'PURCHASE',
  description: 'Corner Coffee — latte',
  postedAt: '2026-04-20T12:05:00.000Z',
};

const auth: ActivityItem = {
  type: 'authorization',
  id: '00000000-0000-0000-0000-000000000010',
  cardId: '00000000-0000-0000-0000-000000000001',
  amountMinor: 4500,
  direction: 'DEBIT',
  currency: 'EUR',
  merchantName: 'Le Bistro',
  merchantCategory: 'Dining',
  merchantCountry: 'FR',
  merchantCity: 'Paris',
  status: 'PENDING',
  declineReason: null,
  authorizedAt: '2026-04-25T10:00:00.000Z',
  expiresAt: '2026-05-02T10:00:00.000Z',
};

describe('ActivityRow', () => {
  it('renders a transaction with merchant + signed amount', () => {
    render(<ActivityRow item={tx} />);
    expect(screen.getByText('Corner Coffee')).toBeInTheDocument();
    expect(screen.getByText('Brooklyn, US')).toBeInTheDocument();
    expect(screen.getByText('−$12.99')).toBeInTheDocument();
  });

  it('renders authorization with PENDING badge', () => {
    render(<ActivityRow item={auth} />);
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('Le Bistro')).toBeInTheDocument();
    expect(screen.getByText('−€45.00')).toBeInTheDocument();
  });

  it('renders DECLINED authorization with reason', () => {
    render(
      <ActivityRow item={{ ...auth, status: 'DECLINED', declineReason: 'Insufficient funds' }} />,
    );
    expect(screen.getByText('DECLINED')).toBeInTheDocument();
    expect(screen.getByText(/Insufficient funds/)).toBeInTheDocument();
  });
});
