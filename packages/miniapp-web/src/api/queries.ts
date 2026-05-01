import type { ActivityItem, Card, LoginRequest } from '@homework/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client.js';

export type SessionPayload =
  | { authenticated: false }
  | { authenticated: true; user: { fullName: string } };
export type LoginPayload = { user: { fullName: string } };
export type CardListPayload = { items: Card[]; nextCursor: string | null };
export type ActivityPayload = { items: ActivityItem[]; nextCursor: string | null };

export const queryKeys = {
  session: ['session'] as const,
  cards: ['cards'] as const,
  card: (id: string) => ['card', id] as const,
  activity: (id: string, kind?: string) => ['activity', id, kind ?? 'all'] as const,
};

export function useSession() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: () => apiFetch<SessionPayload>('/api/session'),
    staleTime: 30_000,
  });
}

export function useCards() {
  return useQuery({
    queryKey: queryKeys.cards,
    queryFn: () => apiFetch<CardListPayload>('/api/cards'),
    staleTime: 30_000,
  });
}

export function useCard(cardId: string | undefined) {
  return useQuery({
    queryKey: cardId ? queryKeys.card(cardId) : ['card', 'none'],
    queryFn: () => apiFetch<Card>(`/api/cards/${cardId}`),
    enabled: Boolean(cardId),
    staleTime: 30_000,
  });
}

export function useCardActivity(
  cardId: string | undefined,
  kind?: 'authorization' | 'transaction',
) {
  const params = new URLSearchParams();
  if (kind) params.set('type', kind);
  const qs = params.toString();
  return useQuery({
    queryKey: cardId ? queryKeys.activity(cardId, kind) : ['activity', 'none'],
    queryFn: () => apiFetch<ActivityPayload>(`/api/cards/${cardId}/activity${qs ? `?${qs}` : ''}`),
    enabled: Boolean(cardId),
    staleTime: 10_000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginRequest) =>
      apiFetch<LoginPayload>('/api/login', { method: 'POST', body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.session });
      qc.invalidateQueries({ queryKey: queryKeys.cards });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>('/api/logout', { method: 'POST' }),
    onSuccess: () => {
      qc.clear();
    },
  });
}
