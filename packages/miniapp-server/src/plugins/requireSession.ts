import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { UnauthorizedError } from '../errors.js';
import type { Session } from '../session/session.js';

declare module 'fastify' {
  interface FastifyInstance {
    requireSession: (req: FastifyRequest) => Promise<void>;
  }
  interface FastifyRequest {
    session: Session;
  }
}

const plugin: FastifyPluginAsync = async (app) => {
  app.decorate('requireSession', async (req: FastifyRequest) => {
    const session = await app.sessions.get(req.telegramUser.id);
    if (!session) throw new UnauthorizedError('NOT_AUTHENTICATED', 'No session — please log in');
    if (session.cardApiTokenExpiresAt.getTime() - Date.now() < 60_000) {
      await app.sessions.delete(req.telegramUser.id);
      throw new UnauthorizedError('SESSION_EXPIRED', 'Session expired — please log in again');
    }
    req.session = session;
  });
};

export const requireSessionPlugin = fp(plugin, { name: 'requireSession' });
