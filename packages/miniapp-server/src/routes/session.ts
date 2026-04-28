import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const SessionResponseSchema = z.discriminatedUnion('authenticated', [
  z.object({ authenticated: z.literal(false) }),
  z.object({ authenticated: z.literal(true), user: z.object({ fullName: z.string() }) }),
]);

export const sessionRoutes: FastifyPluginAsync = async (app) => {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/api/session',
    {
      preHandler: [app.verifyInitData],
      schema: { tags: ['Session'], response: { 200: SessionResponseSchema } },
    },
    async (req) => {
      const session = await app.sessions.get(req.telegramUser.id);
      if (!session) return { authenticated: false } as const;
      return { authenticated: true, user: { fullName: session.fullName } } as const;
    },
  );
};
