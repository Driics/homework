import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { PaginatedSchema, PaginationQuerySchema } from '../src/schemas/pagination.js';

describe('PaginationQuerySchema', () => {
  it('applies defaults when empty', () => {
    const parsed = PaginationQuerySchema.parse({});
    expect(parsed.limit).toBe(20);
    expect(parsed.cursor).toBeUndefined();
  });

  it('coerces string limit', () => {
    expect(PaginationQuerySchema.parse({ limit: '50' }).limit).toBe(50);
  });

  it('rejects limit out of range', () => {
    expect(() => PaginationQuerySchema.parse({ limit: '0' })).toThrow();
    expect(() => PaginationQuerySchema.parse({ limit: '101' })).toThrow();
  });

  it('accepts cursor string', () => {
    expect(PaginationQuerySchema.parse({ cursor: 'abc' }).cursor).toBe('abc');
  });
});

describe('PaginatedSchema', () => {
  const Item = z.object({ id: z.string() });
  const Page = PaginatedSchema(Item);

  it('accepts a valid page', () => {
    const page = { items: [{ id: 'a' }, { id: 'b' }], nextCursor: 'c' };
    expect(Page.parse(page)).toEqual(page);
  });

  it('accepts null nextCursor', () => {
    expect(Page.parse({ items: [], nextCursor: null })).toEqual({
      items: [],
      nextCursor: null,
    });
  });
});
