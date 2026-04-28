import { Bot, InlineKeyboard } from 'grammy';
import type { UserFromGetMe } from 'grammy/types';

export type BotConfig = { token: string; miniappPublicUrl: string; botInfo?: UserFromGetMe };

export function createBot(cfg: BotConfig): Bot {
  const bot = new Bot(cfg.token, cfg.botInfo ? { botInfo: cfg.botInfo } : undefined);

  bot.command('start', async (ctx) => {
    const keyboard = new InlineKeyboard().webApp('Open Cards', cfg.miniappPublicUrl);
    await ctx.reply('Tap the button below to open your card app inside Telegram.', {
      reply_markup: keyboard,
    });
  });
  bot.command('help', async (ctx) => {
    await ctx.reply('Use /start to open the Cards Mini App.');
  });
  bot.on('message', async (ctx) => {
    await ctx.reply('Use /start to open the Cards Mini App.');
  });
  return bot;
}
