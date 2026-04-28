import Fastify, { type FastifyInstance } from 'fastify';
import {
  type ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import type { CardApiClient } from './cardApi/CardApiClient.js';
import type { Config } from './config.js';
import { errorHandlerPlugin } from './plugins/errorHandler.js';
import { initDataAuthPlugin } from './plugins/initDataAuth.js';
import { requestIdPlugin } from './plugins/requestId.js';
import { healthRoutes } from './routes/health.js';
import { loginRoutes } from './routes/login.js';
import { logoutRoutes } from './routes/logout.js';
import { sessionRoutes } from './routes/session.js';
import type { SessionStore } from './session/session.js';

declare module 'fastify' {
  interface FastifyInstance {
    sessions: SessionStore;
    cardApi: CardApiClient;
  }
}

export type BuildOptions = {
  config: Config;
  sessions: SessionStore;
  cardApi: CardApiClient;
  serveStatic?: boolean;
};

export async function buildServer(opts: BuildOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: opts.config.logLevel === 'silent' ? false : { level: opts.config.logLevel },
    disableRequestLogging: opts.config.logLevel === 'silent',
  }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.decorate('sessions', opts.sessions);
  app.decorate('cardApi', opts.cardApi);
  await app.register(requestIdPlugin);
  await app.register(errorHandlerPlugin);
  await app.register(initDataAuthPlugin, {
    botToken: opts.config.telegramBotToken,
    maxAgeSeconds: 24 * 3600,
  });
  await app.register(healthRoutes);
  await app.register(sessionRoutes);
  await app.register(loginRoutes);
  await app.register(logoutRoutes);
  return app;
}
