import { createBot } from './bot/bot.js';
import { CardApiClient } from './cardApi/CardApiClient.js';
import { loadConfig } from './config.js';
import { createLogger } from './logger.js';
import { buildServer } from './server.js';
import { InMemorySessionStore } from './session/InMemorySessionStore.js';

async function start() {
  const config = loadConfig();
  const logger = createLogger({ level: config.logLevel, pretty: config.nodeEnv !== 'production' });

  const sessions = new InMemorySessionStore();
  const cardApi = new CardApiClient({
    baseUrl: config.cardApiUrl,
    timeoutMs: config.cardApiTimeoutMs,
  });
  const bot = createBot({
    token: config.telegramBotToken,
    miniappPublicUrl: config.miniappPublicUrl,
  });

  const app = await buildServer({ config, sessions, cardApi, serveStatic: true, bot });

  const sweepTimer = setInterval(() => {
    void sessions.sweepExpired(new Date()).catch((err) => logger.warn({ err }, 'sweep failed'));
  }, 5 * 60_000);

  app.addHook('onClose', async () => {
    clearInterval(sweepTimer);
  });

  const shutdown = async () => {
    logger.info('shutting down');
    if (config.botMode === 'polling') await bot.stop();
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await app.listen({ port: config.port, host: config.host });
  if (config.botMode === 'polling') {
    await bot.init();
    void bot.start({
      onStart: (me) => logger.info({ username: me.username }, 'bot polling started'),
    });
  } else {
    await bot.api.setWebhook(
      `${config.miniappPublicUrl}/telegram/webhook/${config.telegramBotToken}`,
    );
  }
  logger.info({ port: config.port, botMode: config.botMode }, 'miniapp-server listening');
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
