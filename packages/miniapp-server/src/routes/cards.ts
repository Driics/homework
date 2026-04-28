import {
  ActivityItemSchema,
  CardSchema,
  ErrorResponseSchema,
  PaginatedSchema,
  PaginationQuerySchema,
} from '@homework/shared';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export const cardRoutes: FastifyPluginAsync = async (app) => {
  const t = app.withTypeProvider<ZodTypeProvider>();

  t.get(
    '/api/cards',
    {
      preHandler: [app.verifyInitData, app.requireSession],
      schema: {
        tags: ['Cards'],
        response: { 200: PaginatedSchema(CardSchema), 401: ErrorResponseSchema },
      },
    },
    async (req) => app.cardApi.listCards(req.session.cardApiToken),
  );

  t.get(
    '/api/cards/:cardId',
    {
      preHandler: [app.verifyInitData, app.requireSession],
      schema: {
        tags: ['Cards'],
        params: z.object({ cardId: z.string().uuid() }),
        response: { 200: CardSchema, 401: ErrorResponseSchema, 404: ErrorResponseSchema },
      },
    },
    async (req) => app.cardApi.getCard(req.session.cardApiToken, req.params.cardId),
  );

  t.get(
    '/api/cards/:cardId/activity',
    {
      preHandler: [app.verifyInitData, app.requireSession],
      schema: {
        tags: ['Cards'],
        params: z.object({ cardId: z.string().uuid() }),
        querystring: PaginationQuerySchema,
        response: {
          200: PaginatedSchema(ActivityItemSchema),
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (req) =>
      app.cardApi.listActivity(req.session.cardApiToken, req.params.cardId, {
        limit: req.query.limit,
        cursor: req.query.cursor ?? null,
      }),
  );
};
