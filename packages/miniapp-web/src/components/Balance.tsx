import type { Currency } from '@homework/shared';
import { formatMoney } from '../lib/money.js';

type Props = {
  ledgerMinor: number;
  availableMinor: number;
  currency: Currency;
};

export function Balance({ ledgerMinor, availableMinor, currency }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 rounded-xl bg-[var(--tg-secondary-bg-color,#f7f7f7)] p-4">
      <div>
        <div className="text-xs uppercase tracking-wide text-[var(--tg-hint-color,#999)]">
          Ledger
        </div>
        <div className="mt-1 text-xl font-semibold tabular-nums">
          {formatMoney(ledgerMinor, currency)}
        </div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-[var(--tg-hint-color,#999)]">
          Available
        </div>
        <div className="mt-1 text-xl font-semibold tabular-nums">
          {formatMoney(availableMinor, currency)}
        </div>
      </div>
    </div>
  );
}
