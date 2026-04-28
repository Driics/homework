import {
  ActivityItemSchema,
  CardSchema,
  type LoginRequestSchema,
  LoginResponseSchema,
  PaginatedSchema,
  TransactionSchema,
  UserPublicSchema,
} from '@homework/shared';
import { request } from 'undici';
import type { Dispatcher } from 'undici';
import type { z } from 'zod';
import { mapCardApiError } from './errors.js';

type ClientOptions = { baseUrl: string; timeoutMs: number };

const CardListSchema = PaginatedSchema(CardSchema);
const TxListSchema = PaginatedSchema(TransactionSchema);
const ActivityListSchema = PaginatedSchema(ActivityItemSchema);

export class CardApiClient {
  constructor(private readonly opts: ClientOptions) {}

  async login(
    body: z.infer<typeof LoginRequestSchema>,
  ): Promise<z.infer<typeof LoginResponseSchema>> {
    return this.call('/v1/auth/login', 'POST', LoginResponseSchema, { body });
  }
  async me(token: string): Promise<z.infer<typeof UserPublicSchema>> {
    return this.call('/v1/me', 'GET', UserPublicSchema, { token });
  }
  async listCards(token: string): Promise<z.infer<typeof CardListSchema>> {
    return this.call('/v1/cards', 'GET', CardListSchema, { token });
  }
  async getCard(token: string, cardId: string): Promise<z.infer<typeof CardSchema>> {
    return this.call(`/v1/cards/${cardId}`, 'GET', CardSchema, { token });
  }
  async listTransactions(
    token: string,
    cardId: string,
    q: { limit?: number; cursor?: string | null },
  ): Promise<z.infer<typeof TxListSchema>> {
    return this.call(`/v1/cards/${cardId}/transactions${qs(q)}`, 'GET', TxListSchema, { token });
  }
  async listActivity(
    token: string,
    cardId: string,
    q: { limit?: number; cursor?: string | null },
  ): Promise<z.infer<typeof ActivityListSchema>> {
    return this.call(`/v1/cards/${cardId}/activity${qs(q)}`, 'GET', ActivityListSchema, { token });
  }

  private async call<T>(
    path: string,
    method: 'GET' | 'POST',
    schema: { parse(data: unknown): T },
    o: { body?: unknown; token?: string },
  ): Promise<T> {
    const url = `${this.opts.baseUrl}${path}`;
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (o.token) headers.authorization = `Bearer ${o.token}`;
    let res: Dispatcher.ResponseData;
    try {
      res = await request(url, {
        method,
        headers,
        ...(o.body !== undefined ? { body: JSON.stringify(o.body) } : {}),
        headersTimeout: this.opts.timeoutMs,
        bodyTimeout: this.opts.timeoutMs,
      });
    } catch (err) {
      throw mapCardApiError(502, { code: 'UPSTREAM_UNAVAILABLE', message: (err as Error).message });
    }
    const bodyJson = await res.body.json().catch(() => ({}));
    if (res.statusCode >= 400) throw mapCardApiError(res.statusCode, bodyJson);
    return schema.parse(bodyJson);
  }
}

function qs(q: { limit?: number; cursor?: string | null }): string {
  const sp = new URLSearchParams();
  if (q.limit) sp.set('limit', String(q.limit));
  if (q.cursor) sp.set('cursor', q.cursor);
  const s = sp.toString();
  return s ? `?${s}` : '';
}
