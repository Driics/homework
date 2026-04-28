import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { requestIdPlugin } from './requestId.js';

describe('requestIdPlugin', () => {
  it('assigns a UUID request id and echoes x-request-id', async () => {
    const app = Fastify();
    await app.register(requestIdPlugin);
    app.get('/', async (req) => ({ id: req.id }));
    const res = await app.inject({ method: 'GET', url: '/' });
    expect(res.statusCode).toBe(200);
    const id = JSON.parse(res.payload).id as string;
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.headers['x-request-id']).toBe(id);
    await app.close();
  });

  it('accepts an incoming x-request-id and reuses it', async () => {
    const app = Fastify();
    await app.register(requestIdPlugin);
    app.get('/', async (req) => ({ id: req.id }));
    const res = await app.inject({
      method: 'GET',
      url: '/',
      headers: { 'x-request-id': 'abc-123' },
    });
    expect(JSON.parse(res.payload).id).toBe('abc-123');
    expect(res.headers['x-request-id']).toBe('abc-123');
    await app.close();
  });
});
