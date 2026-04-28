import type { FastifyInstance } from 'fastify';
import { buildServer } from '../../src/server.js';
import { type TestDb, makeTestDb } from './prisma.js';

export type TestApp = { app: FastifyInstance; db: TestDb; cleanup(): Promise<void> };

export async function buildTestApp(): Promise<TestApp> {
  const db = await makeTestDb();
  const app = await buildServer({
    prisma: db.prisma,
    config: {
      nodeEnv: 'test',
      port: 0,
      host: '127.0.0.1',
      logLevel: 'silent',
      databaseUrl: db.dbUrl,
      jwtSecret: 'x'.repeat(32),
      jwtExpiresInSeconds: 3600,
      corsOrigin: '*',
    },
  });
  await app.ready();
  return {
    app,
    db,
    cleanup: async () => {
      await app.close();
      await db.cleanup();
    },
  };
}
