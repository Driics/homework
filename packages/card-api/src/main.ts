import 'dotenv/config';
import { loadConfig } from './config.js';
import { disconnectPrisma, getPrisma } from './db/prisma.js';
import { createLogger } from './logger.js';
import { buildServer } from './server.js';

async function start() {
  const config = loadConfig();
  const logger = createLogger({ level: config.logLevel, pretty: config.nodeEnv !== 'production' });
  const prisma = getPrisma();
  const app = await buildServer({ prisma, config });

  const shutdown = async () => {
    logger.info('shutting down');
    await app.close();
    await disconnectPrisma();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await app.listen({ port: config.port, host: config.host });
  logger.info({ port: config.port }, 'card-api listening');
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
