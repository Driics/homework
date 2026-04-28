import {
  ActivityItemSchema,
  ErrorResponseSchema,
  PaginatedSchema,
  PaginationQuerySchema,
  TransactionSchema,
} from '@homework/shared';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { listCardActivity } from '../services/activityService.js';
import { listCardTransactions } from '../services/transactionService.js';

export const transactionRoutes: FastifyPluginAsync = async (app) => {
  const t = app.withTypeProvider<ZodTypeProvider>();

  t.get(
    '/v1/cards/:cardId/transactions',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['Transactions'],
        params: z.object({ cardId: z.string().uuid() }),
        querystring: PaginationQuerySchema,
        response: {
          200: PaginatedSchema(TransactionSchema),
          404: ErrorResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (req) =>
      listCardTransactions(app.prisma, req.user.id, req.params.cardId, {
        limit: req.query.limit,
        cursor: req.query.cursor ?? null,
      }),
  );

  t.get(
    '/v1/cards/:cardId/activity',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['Activity'],
        params: z.object({ cardId: z.string().uuid() }),
        querystring: PaginationQuerySchema,
        response: {
          200: PaginatedSchema(ActivityItemSchema),
          404: ErrorResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (req) =>
      listCardActivity(app.prisma, req.user.id, req.params.cardId, {
        limit: req.query.limit,
        cursor: req.query.cursor ?? null,
      }),
  );
};
