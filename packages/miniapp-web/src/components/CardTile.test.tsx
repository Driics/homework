import type { Card } from '@homework/shared';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { CardTile } from './CardTile.js';

const card: Card = {
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

function renderTile(c: Card = card) {
  return render(
    <MemoryRouter>
      <CardTile card={c} />
    </MemoryRouter>,
  );
}

describe('CardTile', () => {
  it('renders masked PAN, currency, and balance', () => {
    renderTile();
    expect(screen.getByText('•••• •••• •••• 4242')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();
    expect(screen.getByText('$1,200.00')).toBeInTheDocument();
  });

  it('shows FROZEN badge when status is FROZEN', () => {
    renderTile({ ...card, status: 'FROZEN' });
    expect(screen.getByText('FROZEN')).toBeInTheDocument();
  });

  it('does not show badge when ACTIVE', () => {
    renderTile();
    expect(screen.queryByText('ACTIVE')).not.toBeInTheDocument();
  });

  it('renders a link to /cards/:id', () => {
    renderTile();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/cards/${card.id}`);
  });
});
