import type { Card } from '@homework/shared';
import { Link } from 'react-router-dom';
import { formatMoney } from '../lib/money.js';

type Props = { card: Card };

export function CardTile({ card }: Props) {
  return (
    <Link
      to={`/cards/${card.id}`}
      className="block rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 p-4 text-white shadow-md transition active:scale-[0.98]"
    >
      <div className="flex items-start justify-between">
        <div className="text-xs uppercase tracking-widest opacity-70">{card.type}</div>
        {card.status !== 'ACTIVE' && (
          <span className="rounded-md bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-200">
            {card.status}
          </span>
        )}
      </div>
      <div className="mt-6 font-mono tracking-widest">{card.maskedPan}</div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider opacity-60">Available</div>
          <div className="text-lg font-semibold tabular-nums">
            {formatMoney(card.availableBalanceMinor, card.currency)}
          </div>
        </div>
        <div className="text-xs opacity-70">{card.currency}</div>
      </div>
    </Link>
  );
}
