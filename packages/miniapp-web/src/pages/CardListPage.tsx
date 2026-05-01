import { useNavigate } from 'react-router-dom';
import { useCards, useLogout, useSession } from '../api/queries.js';
import { CardTile } from '../components/CardTile.js';
import { EmptyState } from '../components/EmptyState.js';

export function CardListPage() {
  const cards = useCards();
  const session = useSession();
  const logout = useLogout();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout.mutateAsync();
    navigate('/login', { replace: true });
  };

  return (
    <div className="mx-auto max-w-md px-4 pb-10 pt-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Your cards</h1>
          {session.data?.authenticated && (
            <p className="text-sm text-[var(--tg-hint-color,#999)]">{session.data.user.fullName}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onLogout}
          disabled={logout.isPending}
          className="text-sm text-[var(--tg-link-color,#3390ec)] disabled:opacity-50"
        >
          Log out
        </button>
      </header>

      {cards.isLoading && <div className="text-sm text-[var(--tg-hint-color,#999)]">Loading…</div>}
      {cards.isError && (
        <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Could not load cards.
        </div>
      )}
      {cards.data && cards.data.items.length === 0 && (
        <EmptyState
          title="No cards yet"
          description="Once a card is issued for your account it will appear here."
        />
      )}
      {cards.data && cards.data.items.length > 0 && (
        <div className="space-y-3">
          {cards.data.items.map((c) => (
            <CardTile key={c.id} card={c} />
          ))}
        </div>
      )}
    </div>
  );
}
