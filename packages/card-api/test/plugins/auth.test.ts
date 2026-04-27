import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { signToken } from '../../src/auth/jwt.js';
import { authPlugin } from '../../src/plugins/auth.js';
import { errorHandlerPlugin } from '../../src/plugins/errorHandler.js';
import { requestIdPlugin } from '../../src/plugins/requestId.js';

const secret = 'x'.repeat(32);

async function buildApp() {
  const app = Fastify();
  await app.register(requestIdPlugin);
  await app.register(errorHandlerPlugin);
  await app.register(authPlugin, { jwtSecret: secret });
  app.get('/protected', { preHandler: [app.authenticate] }, async (req) => ({
    userId: req.user.id,
  }));
  app.get('/open', async () => ({ ok: true }));
  return app;
}

describe('authPlugin', () => {
  it('401 MISSING_TOKEN without header', async () => {
    const app = await buildApp();
    const r = await app.inject({ method: 'GET', url: '/protected' });
    expect(r.statusCode).toBe(401);
    expect(JSON.parse(r.payload).code).toBe('MISSING_TOKEN');
    await app.close();
  });
  it('401 INVALID_TOKEN on bad signature', async () => {
    const app = await buildApp();
    const r = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: 'Bearer abc.def.ghi' },
    });
    expect(r.statusCode).toBe(401);
    expect(JSON.parse(r.payload).code).toBe('INVALID_TOKEN');
    await app.close();
  });
  it('401 TOKEN_EXPIRED on expired', async () => {
    const app = await buildApp();
    const { token } = await signToken({ sub: 'u1', email: 'a@b.com' }, secret, -1);
    const r = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(r.statusCode).toBe(401);
    expect(JSON.parse(r.payload).code).toBe('TOKEN_EXPIRED');
    await app.close();
  });
  it('200 with valid token and attaches user', async () => {
    const app = await buildApp();
    const { token } = await signToken({ sub: 'u1', email: 'a@b.com' }, secret, 60);
    const r = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.payload).userId).toBe('u1');
    await app.close();
  });
});
