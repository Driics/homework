import { ErrorResponseSchema, LoginRequestSchema } from '@homework/shared';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const LoginResponseSchema = z.object({ user: z.object({ fullName: z.string() }) });

export const loginRoutes: FastifyPluginAsync = async (app) => {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/api/login',
    {
      preHandler: [app.verifyInitData],
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
          keyGenerator: (req) => {
            const init = req.headers['x-telegram-init-data'];
            return typeof init === 'string' ? init.slice(0, 64) : req.ip;
          },
        },
      },
      schema: {
        tags: ['Auth'],
        body: LoginRequestSchema,
        response: {
          200: LoginResponseSchema,
          401: ErrorResponseSchema,
          429: ErrorResponseSchema,
          502: ErrorResponseSchema,
        },
      },
    },
    async (req) => {
      const resp = await app.cardApi.login(req.body);
      await app.sessions.set(req.telegramUser.id, {
        userId: resp.user.id,
        fullName: resp.user.fullName,
        cardApiToken: resp.token,
        cardApiTokenExpiresAt: new Date(resp.expiresAt),
      });
      return { user: { fullName: resp.user.fullName } };
    },
  );
};
