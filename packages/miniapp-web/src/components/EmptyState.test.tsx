import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './EmptyState.js';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState title="No cards" description="Once a card is issued it will appear here." />,
    );
    expect(screen.getByRole('heading', { name: 'No cards' })).toBeInTheDocument();
    expect(screen.getByText(/issued/)).toBeInTheDocument();
  });
});
