import { beforeEach, describe, expect, it } from 'vitest';
import { InMemorySessionStore } from '../../src/session/InMemorySessionStore.js';
import type { Session } from '../../src/session/session.js';

const s = (expiresAt: Date): Session => ({
  userId: 'u1',
  fullName: 'A',
  cardApiToken: 'tok',
  cardApiTokenExpiresAt: expiresAt,
});

describe('InMemorySessionStore', () => {
  let store: InMemorySessionStore;
  beforeEach(() => {
    store = new InMemorySessionStore();
  });

  it('set/get round-trip', async () => {
    const exp = new Date(Date.now() + 60_000);
    await store.set(42, s(exp));
    expect(await store.get(42)).toEqual(s(exp));
  });
  it('returns null after delete', async () => {
    await store.set(42, s(new Date(Date.now() + 60_000)));
    await store.delete(42);
    expect(await store.get(42)).toBeNull();
  });
  it('returns null on missing', async () => {
    expect(await store.get(999)).toBeNull();
  });
  it('get returns null when expired', async () => {
    const expired = new Date(Date.now() - 1_000);
    await store.set(42, s(expired));
    expect(await store.get(42)).toBeNull();
  });
  it('sweepExpired removes stale entries and returns count', async () => {
    await store.set(1, s(new Date(Date.now() - 10)));
    await store.set(2, s(new Date(Date.now() + 60_000)));
    const removed = await store.sweepExpired(new Date());
    expect(removed).toBe(1);
    expect(await store.get(1)).toBeNull();
    expect(await store.get(2)).not.toBeNull();
  });
});
