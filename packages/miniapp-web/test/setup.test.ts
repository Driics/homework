import { describe, expect, it } from 'vitest';
import { installTelegramMock, uninstallTelegramMock } from './telegramMock.js';

describe('telegramMock', () => {
  it('installs and removes window.Telegram.WebApp', () => {
    installTelegramMock();
    expect(window.Telegram?.WebApp.initData).toContain('hash=');
    uninstallTelegramMock();
    expect(window.Telegram).toBeUndefined();
  });
});
