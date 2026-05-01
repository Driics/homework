import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Balance } from './Balance.js';

describe('Balance', () => {
  it('renders ledger and available labels with formatted values', () => {
    render(<Balance ledgerMinor={125000} availableMinor={120000} currency="USD" />);
    expect(screen.getByText('Ledger')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('$1,250.00')).toBeInTheDocument();
    expect(screen.getByText('$1,200.00')).toBeInTheDocument();
  });
});
