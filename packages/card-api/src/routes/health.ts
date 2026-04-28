import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .get(
      '/v1/health',
      { schema: { tags: ['Health'], response: { 200: z.object({ status: z.literal('ok') }) } } },
      async () => ({ status: 'ok' as const }),
    );
};
