import type { ActivityItem } from '@homework/shared';
import { formatTime } from '../lib/dates.js';
import { Amount } from './Amount.js';
import { CountryFlag } from './CountryFlag.js';

type Props = { item: ActivityItem };

export function ActivityRow({ item }: Props) {
  const isAuth = item.type === 'authorization';
  const timestamp = isAuth ? item.authorizedAt : item.postedAt;
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--tg-section-separator-color,#e5e7eb)] py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{item.merchantName}</span>
          {isAuth && (
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                item.status === 'DECLINED'
                  ? 'bg-red-100 text-red-700'
                  : item.status === 'PENDING'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-600'
              }`}
            >
              {item.status}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-[var(--tg-hint-color,#999)]">
          <CountryFlag country={item.merchantCountry} />
          <span>
            {item.merchantCity}, {item.merchantCountry}
          </span>
          <span className="opacity-60">·</span>
          <span>{formatTime(timestamp)}</span>
        </div>
        {isAuth && item.status === 'DECLINED' && item.declineReason && (
          <div className="mt-0.5 text-xs text-red-600">{item.declineReason}</div>
        )}
      </div>
      <Amount amountMinor={item.amountMinor} currency={item.currency} direction={item.direction} />
    </div>
  );
}
