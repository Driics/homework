import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CountryFlag } from './CountryFlag.js';

describe('CountryFlag', () => {
  it('renders a flag emoji from a 2-letter country code', () => {
    render(<CountryFlag country="US" />);
    expect(screen.getByLabelText('US')).toHaveTextContent('🇺🇸');
  });
  it('renders GB for the UK', () => {
    render(<CountryFlag country="GB" />);
    expect(screen.getByLabelText('GB')).toHaveTextContent('🇬🇧');
  });
  it('renders nothing when country length is not 2', () => {
    const { container } = render(<CountryFlag country="USA" />);
    expect(container).toBeEmptyDOMElement();
  });
});
