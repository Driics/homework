import type { Currency, Direction } from '@homework/shared';

// Intl.NumberFormat construction is expensive, so cache one formatter per
// currency at module scope instead of recreating it on every call.
const formatterCache = new Map<Currency, Intl.NumberFormat>();

function getFormatter(currency: Currency): Intl.NumberFormat {
  let formatter = formatterCache.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    formatterCache.set(currency, formatter);
  }
  return formatter;
}

export function formatMoney(amountMinor: number, currency: Currency): string {
  return getFormatter(currency).format(amountMinor / 100);
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
