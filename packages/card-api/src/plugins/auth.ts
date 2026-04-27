import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { errors as joseErrors } from 'jose';
import { verifyToken } from '../auth/jwt.js';
import { UnauthorizedError } from '../errors.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user: { id: string; email: string };
  }
}

export type AuthPluginOptions = { jwtSecret: string };

const plugin: FastifyPluginAsync<AuthPluginOptions> = async (app, opts) => {
  app.decorate('authenticate', async (req: FastifyRequest) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedError('MISSING_TOKEN', 'Authorization header missing or malformed');
    }
    const token = header.slice('Bearer '.length);
    try {
      const claims = await verifyToken(token, opts.jwtSecret);
      req.user = { id: claims.sub, email: claims.email };
    } catch (err) {
      if (err instanceof joseErrors.JWTExpired) {
        throw new UnauthorizedError('TOKEN_EXPIRED', 'Token has expired');
      }
      throw new UnauthorizedError('INVALID_TOKEN', 'Token is invalid');
    }
  });
};

export const authPlugin = fp(plugin, { name: 'auth' });
