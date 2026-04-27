export const DEFAULT_LIMIT = 20;

export type PaginatedResult<T> = { items: T[]; nextCursor: string | null };

export function paginateBy<T extends { id: string }>(
  rows: T[],
  opts: { limit: number },
): PaginatedResult<T> {
  const sliced = rows.slice(0, opts.limit);
  const reachedEnd = rows.length <= opts.limit;
  return {
    items: sliced,
    nextCursor: reachedEnd ? null : (sliced[sliced.length - 1]?.id ?? null),
  };
}
