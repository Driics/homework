import { describe, expect, it } from 'vitest';
import {
  AppError,
  ForbiddenError,
  InternalError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from './errors.js';

describe('AppError hierarchy', () => {
  it('UnauthorizedError defaults to 401', () => {
    const e = new UnauthorizedError('INVALID_CREDENTIALS', 'bad login');
    expect(e).toBeInstanceOf(AppError);
    expect(e.statusCode).toBe(401);
    expect(e.code).toBe('INVALID_CREDENTIALS');
  });

  it('ForbiddenError defaults to 403', () => {
    const e = new ForbiddenError('CARD_NOT_OWNED', 'forbidden');
    expect(e.statusCode).toBe(403);
  });

  it('NotFoundError defaults to 404', () => {
    const e = new NotFoundError('CARD_NOT_FOUND', 'not found');
    expect(e.statusCode).toBe(404);
  });

  it('ValidationError defaults to 400 and carries details', () => {
    const e = new ValidationError('VALIDATION_FAILED', 'bad', [{ path: 'email' }]);
    expect(e.statusCode).toBe(400);
    expect(e.details).toEqual([{ path: 'email' }]);
  });

  it('InternalError defaults to 500', () => {
    const e = new InternalError('INTERNAL', 'oops');
    expect(e.statusCode).toBe(500);
  });

  it('AppError.toJSON shape is stable', () => {
    const e = new NotFoundError('CARD_NOT_FOUND', 'nope');
    expect(e.toJSON('req-123')).toEqual({
      code: 'CARD_NOT_FOUND',
      message: 'nope',
      requestId: 'req-123',
    });
  });
});
