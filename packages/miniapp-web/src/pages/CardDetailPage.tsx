import type { ActivityItem } from '@homework/shared';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCard, useCardActivity } from '../api/queries.js';
import { ActivityRow } from '../components/ActivityRow.js';
import { Balance } from '../components/Balance.js';
import { EmptyState } from '../components/EmptyState.js';
import { formatDayHeading } from '../lib/dates.js';
import { attachBackButton } from '../telegram/webapp.js';

type Filter = 'all' | 'authorization' | 'transaction';

export function CardDetailPage() {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const card = useCard(cardId);
  const activity = useCardActivity(cardId, filter === 'all' ? undefined : filter);

  useEffect(() => {
    return attachBackButton(() => navigate('/cards'));
  }, [navigate]);

  const grouped = useMemo(() => groupByDay(activity.data?.items ?? []), [activity.data]);

  return (
    <div className="mx-auto max-w-md px-4 pb-10 pt-6">
      {card.data && (
        <>
          <div className="mb-4 text-sm text-[var(--tg-hint-color,#999)]">{card.data.maskedPan}</div>
          <Balance
            ledgerMinor={card.data.ledgerBalanceMinor}
            availableMinor={card.data.availableBalanceMinor}
            currency={card.data.currency}
          />
        </>
      )}

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          All activity
        </Chip>
        <Chip active={filter === 'transaction'} onClick={() => setFilter('transaction')}>
          Transactions only
        </Chip>
        <Chip active={filter === 'authorization'} onClick={() => setFilter('authorization')}>
          Authorizations only
        </Chip>
      </div>

      <div className="mt-2">
        {activity.isLoading && (
          <div className="py-4 text-sm text-[var(--tg-hint-color,#999)]">Loading…</div>
        )}
        {activity.isError && (
          <div role="alert" className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            Could not load activity.
          </div>
        )}
        {activity.data && activity.data.items.length === 0 && (
          <EmptyState title="No activity" description="Recent transactions will appear here." />
        )}
        {grouped.map(([day, items]) => (
          <section key={day} className="mt-4">
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--tg-hint-color,#999)]">
              {day}
            </h2>
            {items.map((item) => (
              <ActivityRow key={`${item.type}:${item.id}`} item={item} />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: { active: boolean; onClick(): void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
        active
          ? 'bg-[var(--tg-button-color,#3390ec)] text-[var(--tg-button-text-color,#fff)]'
          : 'bg-[var(--tg-secondary-bg-color,#f7f7f7)] text-[var(--tg-text-color,#111)]'
      }`}
    >
      {children}
    </button>
  );
}

function groupByDay(items: ActivityItem[]): Array<[string, ActivityItem[]]> {
  const buckets = new Map<string, ActivityItem[]>();
  for (const item of items) {
    const ts = item.type === 'authorization' ? item.authorizedAt : item.postedAt;
    const heading = formatDayHeading(ts);
    const arr = buckets.get(heading) ?? [];
    arr.push(item);
    buckets.set(heading, arr);
  }
  return Array.from(buckets.entries());
}
