import type { Session, SessionStore } from './session.js';

export class InMemorySessionStore implements SessionStore {
  private readonly map = new Map<number, Session>();

  async get(telegramUserId: number): Promise<Session | null> {
    const entry = this.map.get(telegramUserId);
    if (!entry) return null;
    if (entry.cardApiTokenExpiresAt.getTime() <= Date.now()) {
      this.map.delete(telegramUserId);
      return null;
    }
    return entry;
  }
  async set(telegramUserId: number, session: Session): Promise<void> {
    this.map.set(telegramUserId, session);
  }
  async delete(telegramUserId: number): Promise<void> {
    this.map.delete(telegramUserId);
  }
  async sweepExpired(now: Date): Promise<number> {
    let removed = 0;
    for (const [k, v] of this.map.entries()) {
      if (v.cardApiTokenExpiresAt.getTime() <= now.getTime()) {
        this.map.delete(k);
        removed++;
      }
    }
    return removed;
  }
}
