import {
  type AppError,
  BadGatewayError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../errors.js';

export function mapCardApiError(status: number, body: unknown): AppError {
  const envelope =
    typeof body === 'object' && body !== null && 'code' in body
      ? (body as { code: string; message?: string })
      : null;
  const code = envelope?.code ?? 'UPSTREAM_ERROR';
  const msg = envelope?.message ?? 'Card API error';
  if (status === 401)
    return new UnauthorizedError(
      code === 'INVALID_CREDENTIALS' ? 'INVALID_CREDENTIALS' : 'SESSION_EXPIRED',
      msg,
    );
  if (status === 404) return new NotFoundError(code, msg);
  if (status === 400) return new ValidationError(code, msg);
  return new BadGatewayError('UPSTREAM_UNAVAILABLE', msg);
}
