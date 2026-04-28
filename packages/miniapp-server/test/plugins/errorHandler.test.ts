import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import {
  BadGatewayError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../src/errors.js';
import { errorHandlerPlugin } from '../../src/plugins/errorHandler.js';
import { requestIdPlugin } from '../../src/plugins/requestId.js';

async function buildApp() {
  const app = Fastify();
  await app.register(requestIdPlugin);
  await app.register(errorHandlerPlugin);
  app.get('/404', async () => {
    throw new NotFoundError('CARD_NOT_FOUND', 'nope');
  });
  app.get('/401', async () => {
    throw new UnauthorizedError('INVALID_CREDENTIALS', 'bad');
  });
  app.get('/400', async () => {
    throw new ValidationError('VALIDATION_FAILED', 'bad', [{ path: 'x' }]);
  });
  app.get('/500', async () => {
    throw new Error('boom');
  });
  return app;
}

describe('errorHandlerPlugin', () => {
  it('maps AppError to JSON envelope', async () => {
    const app = await buildApp();
    const r = await app.inject({ method: 'GET', url: '/404' });
    expect(r.statusCode).toBe(404);
    const body = JSON.parse(r.payload);
    expect(body.code).toBe('CARD_NOT_FOUND');
    expect(body.requestId).toMatch(/^[0-9a-f-]{36}$/);
    await app.close();
  });

  it('maps 401', async () => {
    const app = await buildApp();
    const r = await app.inject({ method: 'GET', url: '/401' });
    expect(r.statusCode).toBe(401);
    expect(JSON.parse(r.payload).code).toBe('INVALID_CREDENTIALS');
    await app.close();
  });

  it('maps ValidationError with details', async () => {
    const app = await buildApp();
    const r = await app.inject({ method: 'GET', url: '/400' });
    expect(r.statusCode).toBe(400);
    expect(JSON.parse(r.payload).details).toEqual([{ path: 'x' }]);
    await app.close();
  });

  it('maps unknown Error to 500 INTERNAL with scrubbed message', async () => {
    const app = await buildApp();
    const r = await app.inject({ method: 'GET', url: '/500' });
    expect(r.statusCode).toBe(500);
    const body = JSON.parse(r.payload);
    expect(body.code).toBe('INTERNAL');
    expect(body.message).not.toContain('boom');
    await app.close();
  });

  it('maps BadGatewayError to 502 UPSTREAM_UNAVAILABLE', async () => {
    const app = Fastify();
    await app.register(requestIdPlugin);
    await app.register(errorHandlerPlugin);
    app.get('/502', async () => {
      throw new BadGatewayError('UPSTREAM_UNAVAILABLE', 'card-api down');
    });
    const r = await app.inject({ method: 'GET', url: '/502' });
    expect(r.statusCode).toBe(502);
    expect(JSON.parse(r.payload).code).toBe('UPSTREAM_UNAVAILABLE');
    await app.close();
  });
});
