import { CardSchema, ErrorResponseSchema, PaginatedSchema } from '@homework/shared';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { listUserCards, loadOwnedCard } from '../services/cardService.js';

export const cardRoutes: FastifyPluginAsync = async (app) => {
  const t = app.withTypeProvider<ZodTypeProvider>();

  t.get(
    '/v1/cards',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['Cards'],
        response: { 200: PaginatedSchema(CardSchema), 401: ErrorResponseSchema },
      },
    },
    async (req) => ({ items: await listUserCards(app.prisma, req.user.id), nextCursor: null }),
  );

  t.get(
    '/v1/cards/:cardId',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['Cards'],
        params: z.object({ cardId: z.string().uuid() }),
        response: { 200: CardSchema, 404: ErrorResponseSchema, 401: ErrorResponseSchema },
      },
    },
    async (req) => loadOwnedCard(app.prisma, req.user.id, req.params.cardId),
  );
};
