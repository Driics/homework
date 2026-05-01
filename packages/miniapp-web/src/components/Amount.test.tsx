import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Amount } from './Amount.js';

describe('Amount', () => {
  it('renders DEBIT in destructive color with minus sign', () => {
    render(<Amount amountMinor={1299} currency="USD" direction="DEBIT" />);
    const node = screen.getByText('−$12.99');
    expect(node).toHaveClass('text-[var(--tg-destructive-text-color,#dc3545)]');
  });

  it('renders CREDIT in success color with plus sign', () => {
    render(<Amount amountMinor={500} currency="USD" direction="CREDIT" />);
    const node = screen.getByText('+$5.00');
    expect(node).toHaveClass('text-emerald-600');
  });

  it('omits sign when signed=false', () => {
    render(<Amount amountMinor={500} currency="USD" direction="DEBIT" signed={false} />);
    expect(screen.getByText('$5.00')).toBeInTheDocument();
  });
});
