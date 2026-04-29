import type { FastifyPluginAsync } from 'fastify';
import type { Bot } from 'grammy';
import { webhookCallback } from 'grammy';

export const telegramWebhookRoutes =
  (bot: Bot, secretPath: string): FastifyPluginAsync =>
  async (app) => {
    const handler = webhookCallback(bot, 'fastify');
    app.post(`/telegram/webhook/${secretPath}`, handler);
  };
