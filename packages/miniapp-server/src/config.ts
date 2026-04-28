import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']).default('info'),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  MINIAPP_PUBLIC_URL: z.string().url(),
  BOT_MODE: z.enum(['polling', 'webhook']).default('polling'),
  CARD_API_URL: z.string().url(),
  CARD_API_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  STATIC_DIR: z.string().default('../miniapp-web/dist'),
});

export type Config = {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  host: string;
  logLevel: string;
  telegramBotToken: string;
  miniappPublicUrl: string;
  botMode: 'polling' | 'webhook';
  cardApiUrl: string;
  cardApiTimeoutMs: number;
  sessionTtlSeconds: number;
  staticDir: string;
};

export function loadConfig(): Config {
  const r = EnvSchema.safeParse(process.env);
  if (!r.success) {
    const issues = r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment: ${issues}`);
  }
  const e = r.data;
  return {
    nodeEnv: e.NODE_ENV,
    port: e.PORT,
    host: e.HOST,
    logLevel: e.LOG_LEVEL,
    telegramBotToken: e.TELEGRAM_BOT_TOKEN,
    miniappPublicUrl: e.MINIAPP_PUBLIC_URL,
    botMode: e.BOT_MODE,
    cardApiUrl: e.CARD_API_URL,
    cardApiTimeoutMs: e.CARD_API_TIMEOUT_MS,
    sessionTtlSeconds: e.SESSION_TTL_SECONDS,
    staticDir: e.STATIC_DIR,
  };
}
