import { z } from 'zod';

export const ErrorResponseSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  details: z.unknown().optional(),
  requestId: z.string().uuid(),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export const CARD_API_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  MISSING_TOKEN: 'MISSING_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  CARD_NOT_FOUND: 'CARD_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL: 'INTERNAL',
} as const;
export type CardApiErrorCode = (typeof CARD_API_ERROR_CODES)[keyof typeof CARD_API_ERROR_CODES];

export const MINIAPP_ERROR_CODES = {
  MISSING_INIT_DATA: 'MISSING_INIT_DATA',
  INVALID_INIT_DATA: 'INVALID_INIT_DATA',
  STALE_INIT_DATA: 'STALE_INIT_DATA',
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  UPSTREAM_UNAVAILABLE: 'UPSTREAM_UNAVAILABLE',
  RATE_LIMITED: 'RATE_LIMITED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INTERNAL: 'INTERNAL',
} as const;
export type MiniappErrorCode = (typeof MINIAPP_ERROR_CODES)[keyof typeof MINIAPP_ERROR_CODES];
