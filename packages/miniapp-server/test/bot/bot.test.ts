import { describe, expect, it } from 'vitest';
import { createBot } from '../../src/bot/bot.js';

describe('createBot', () => {
  it('/start replies with a web_app button', async () => {
    const botInfo = {
      id: 1,
      is_bot: true,
      first_name: 'Test',
      username: 'testbot',
      can_join_groups: true,
      can_read_all_group_messages: false,
      supports_inline_queries: false,
    };
    const bot = createBot({
      token: '1:TEST',
      miniappPublicUrl: 'https://example.ngrok.app',
      botInfo,
    });
    await bot.init();

    const replies: unknown[] = [];
    bot.api.config.use(async (prev, method, payload, signal) => {
      if (method === 'sendMessage') {
        const p = payload as { text: string; reply_markup: unknown };
        replies.push({ text: p.text, extra: { reply_markup: p.reply_markup } });
        return { ok: true, result: {} } as never;
      }
      return prev(method, payload, signal);
    });

    const update = {
      update_id: 1,
      message: {
        message_id: 1,
        date: Math.floor(Date.now() / 1000),
        chat: { id: 99, type: 'private', first_name: 'A' },
        from: { id: 99, is_bot: false, first_name: 'A' },
        text: '/start',
        entities: [{ type: 'bot_command', offset: 0, length: 6 }],
      },
    };
    await bot.handleUpdate(update as never);

    expect(replies).toHaveLength(1);
    const r = replies[0] as {
      extra: {
        reply_markup: { inline_keyboard: Array<Array<{ text: string; web_app: { url: string } }>> };
      };
    };
    const btn = r.extra.reply_markup.inline_keyboard[0]![0]!;
    expect(btn.web_app.url).toBe('https://example.ngrok.app');
  });
});
