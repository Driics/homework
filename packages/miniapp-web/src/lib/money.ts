import type { Currency, Direction } from '@homework/shared';

export function formatMoney(amountMinor: number, currency: Currency): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

export function formatSignedMoney(
  amountMinor: number,
  currency: Currency,
  direction: Direction,
): string {
  const formatted = formatMoney(amountMinor, currency);
  // Use the typographic minus (U+2212) to differentiate from a hyphen and to render cleanly inside Telegram.
  return direction === 'DEBIT' ? `−${formatted}` : `+${formatted}`;
}
