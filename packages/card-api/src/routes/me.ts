import { ErrorResponseSchema, UserPublicSchema } from '@homework/shared';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { getUserProfile } from '../services/userService.js';

export const meRoutes: FastifyPluginAsync = async (app) => {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/v1/me',
    {
      preHandler: [app.authenticate],
      schema: { tags: ['Me'], response: { 200: UserPublicSchema, 401: ErrorResponseSchema } },
    },
    async (req) => getUserProfile(app.prisma, req.user.id),
  );
};
