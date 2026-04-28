import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { UnauthorizedError } from '../errors.js';
import {
  InvalidInitDataError,
  StaleInitDataError,
  type TelegramUser,
  verifyInitData,
} from '../telegram/verifyInitData.js';

declare module 'fastify' {
  interface FastifyInstance {
    verifyInitData: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    telegramUser: TelegramUser;
  }
}

export type InitDataAuthOptions = { botToken: string; maxAgeSeconds: number };

const plugin: FastifyPluginAsync<InitDataAuthOptions> = async (app, opts) => {
  app.decorate('verifyInitData', async (req: FastifyRequest) => {
    const header = req.headers['x-telegram-init-data'];
    const value = Array.isArray(header) ? header[0] : header;
    if (!value || typeof value !== 'string') {
      throw new UnauthorizedError('MISSING_INIT_DATA', 'X-Telegram-Init-Data header is required');
    }
    try {
      const v = verifyInitData(value, opts.botToken, opts.maxAgeSeconds);
      req.telegramUser = v.user;
    } catch (err) {
      if (err instanceof StaleInitDataError)
        throw new UnauthorizedError('STALE_INIT_DATA', 'initData is stale');
      if (err instanceof InvalidInitDataError)
        throw new UnauthorizedError('INVALID_INIT_DATA', err.message);
      throw err;
    }
  });
};

export const initDataAuthPlugin = fp(plugin, { name: 'initDataAuth' });
