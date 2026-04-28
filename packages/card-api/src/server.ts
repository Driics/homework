import type { PrismaClient } from '@prisma/client';
import Fastify, { type FastifyInstance } from 'fastify';
import {
  type ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import type { Config } from './config.js';
import { authPlugin } from './plugins/auth.js';
import { errorHandlerPlugin } from './plugins/errorHandler.js';
import { requestIdPlugin } from './plugins/requestId.js';
import { authRoutes } from './routes/auth.js';
import { cardRoutes } from './routes/cards.js';
import { healthRoutes } from './routes/health.js';
import { meRoutes } from './routes/me.js';
import { transactionRoutes } from './routes/transactions.js';

export type BuildOptions = { prisma: PrismaClient; config: Config };

export async function buildServer(opts: BuildOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: opts.config.logLevel === 'silent' ? false : { level: opts.config.logLevel },
  }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  (app as unknown as { decorate: (k: string, v: unknown) => void }).decorate('prisma', opts.prisma);
  await app.register(requestIdPlugin);
  await app.register(errorHandlerPlugin);
  await app.register(authPlugin, { jwtSecret: opts.config.jwtSecret });
  await app.register(healthRoutes);
  await app.register(authRoutes(opts.config));
  await app.register(meRoutes);
  await app.register(cardRoutes);
  await app.register(transactionRoutes);
  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
