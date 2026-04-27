import { describe, expect, it } from 'vitest';
import { DEFAULT_LIMIT, paginateBy } from '../../src/lib/pagination.js';

describe('paginateBy', () => {
  const rows = Array.from({ length: 5 }, (_, i) => ({ id: `id-${i}` }));
  it('returns up to limit items and next cursor on full page', () => {
    const r = paginateBy(rows, { limit: 3 });
    expect(r.items).toHaveLength(3);
    expect(r.nextCursor).toBe('id-2');
  });
  it('returns null nextCursor when page is not full', () => {
    const r = paginateBy(rows, { limit: 10 });
    expect(r.items).toHaveLength(5);
    expect(r.nextCursor).toBeNull();
  });
  it('default limit is 20', () => {
    expect(DEFAULT_LIMIT).toBe(20);
  });
});
