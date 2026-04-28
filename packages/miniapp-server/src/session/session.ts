export type Session = {
  userId: string;
  fullName: string;
  cardApiToken: string;
  cardApiTokenExpiresAt: Date;
};

export interface SessionStore {
  get(telegramUserId: number): Promise<Session | null>;
  set(telegramUserId: number, session: Session): Promise<void>;
  delete(telegramUserId: number): Promise<void>;
  sweepExpired(now: Date): Promise<number>;
}
