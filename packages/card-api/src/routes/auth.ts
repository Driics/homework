import { ErrorResponseSchema, LoginRequestSchema, LoginResponseSchema } from '@homework/shared';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { signToken } from '../auth/jwt.js';
import type { Config } from '../config.js';
import { verifyUserCredentials } from '../services/userService.js';

export const authRoutes =
  (cfg: Pick<Config, 'jwtSecret' | 'jwtExpiresInSeconds'>): FastifyPluginAsync =>
  async (app) => {
    app.withTypeProvider<ZodTypeProvider>().post(
      '/v1/auth/login',
      {
        schema: {
          tags: ['Auth'],
          body: LoginRequestSchema,
          response: {
            200: LoginResponseSchema,
            400: ErrorResponseSchema,
            401: ErrorResponseSchema,
          },
        },
      },
      async (req) => {
        const user = await verifyUserCredentials(app.prisma, req.body);
        const { token, expiresAt } = await signToken(
          { sub: user.id, email: user.email },
          cfg.jwtSecret,
          cfg.jwtExpiresInSeconds,
        );
        return { token, expiresAt: expiresAt.toISOString(), user };
      },
    );
  };
