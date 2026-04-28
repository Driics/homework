import type { FastifyInstance } from 'fastify';
import type { CardApiClient } from '../../src/cardApi/CardApiClient.js';
import type { Config } from '../../src/config.js';
import { buildServer } from '../../src/server.js';
import { InMemorySessionStore } from '../../src/session/InMemorySessionStore.js';

export type TestDeps = {
  app: FastifyInstance;
  sessions: InMemorySessionStore;
  cleanup(): Promise<void>;
};

export async function buildTestApp(overrides?: {
  cardApi?: Partial<CardApiClient>;
  config?: Partial<Config>;
}): Promise<TestDeps> {
  const sessions = new InMemorySessionStore();
  const defaultCardApi: CardApiClient = {
    login: async () => {
      throw new Error('not stubbed');
    },
    me: async () => {
      throw new Error('not stubbed');
    },
    listCards: async () => {
      throw new Error('not stubbed');
    },
    getCard: async () => {
      throw new Error('not stubbed');
    },
    listTransactions: async () => {
      throw new Error('not stubbed');
    },
    listActivity: async () => {
      throw new Error('not stubbed');
    },
  } as unknown as CardApiClient;

  const config: Config = {
    nodeEnv: 'test',
    port: 0,
    host: '127.0.0.1',
    logLevel: 'silent',
    telegramBotToken: '1:TESTBOT',
    miniappPublicUrl: 'https://x.y',
    botMode: 'polling',
    cardApiUrl: 'http://card-api.test',
    cardApiTimeoutMs: 2000,
    sessionTtlSeconds: 3600,
    staticDir: './.tmp/static',
    ...overrides?.config,
  };
  const app = await buildServer({
    config,
    sessions,
    cardApi: { ...defaultCardApi, ...overrides?.cardApi } as CardApiClient,
    serveStatic: false,
  });
  await app.ready();
  return {
    app,
    sessions,
    cleanup: async () => {
      await app.close();
    },
  };
}
