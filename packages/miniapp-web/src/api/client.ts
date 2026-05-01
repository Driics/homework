import { getInitData } from '../telegram/webapp.js';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;
  readonly details?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    requestId?: string,
    details?: unknown,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    if (requestId !== undefined) this.requestId = requestId;
    if (details !== undefined) this.details = details;
  }
}

export type ApiFetchOptions = {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
};

export async function apiFetch<T = unknown>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'X-Telegram-Init-Data': getInitData(),
    Accept: 'application/json',
  };
  let body: BodyInit | undefined;
  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }
  const init: RequestInit = { method: opts.method ?? 'GET', headers };
  if (body !== undefined) init.body = body;
  if (opts.signal) init.signal = opts.signal;

  const response = await fetch(path, init);
  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    if (isJson) {
      const payload = (await response.json()) as {
        code?: string;
        message?: string;
        requestId?: string;
        details?: unknown;
      };
      throw new ApiError(
        response.status,
        payload.code ?? 'INTERNAL',
        payload.message ?? response.statusText,
        payload.requestId,
        payload.details,
      );
    }
    throw new ApiError(response.status, 'INTERNAL', response.statusText);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
