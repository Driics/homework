import type { Currency, Direction } from '@homework/shared';
import { formatMoney, formatSignedMoney } from '../lib/money.js';

type Props = {
  amountMinor: number;
  currency: Currency;
  direction: Direction;
  signed?: boolean;
  className?: string;
};

export function Amount({ amountMinor, currency, direction, signed = true, className = '' }: Props) {
  const text = signed
    ? formatSignedMoney(amountMinor, currency, direction)
    : formatMoney(amountMinor, currency);
  const colorClass =
    direction === 'DEBIT' ? 'text-[var(--tg-destructive-text-color,#dc3545)]' : 'text-emerald-600';
  return <span className={`font-medium tabular-nums ${colorClass} ${className}`}>{text}</span>;
}
