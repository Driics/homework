import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { installTelegramMock, uninstallTelegramMock } from '../../test/telegramMock.js';
import { applyTelegramTheme, attachBackButton, getInitData, getWebApp } from './webapp.js';

describe('telegram/webapp', () => {
  beforeEach(() => installTelegramMock());
  afterEach(() => uninstallTelegramMock());

  it('returns the WebApp instance', () => {
    expect(getWebApp()?.initData).toContain('hash=');
  });

  it('returns initData string', () => {
    expect(getInitData()).toContain('hash=');
  });

  it('writes theme params as CSS variables on document root', () => {
    applyTelegramTheme();
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--tg-bg-color')).toBe('#ffffff');
    expect(root.style.getPropertyValue('--tg-button-color')).toBe('#3390ec');
    expect(root.style.getPropertyValue('--tg-destructive-text-color')).toBe('#dc3545');
  });

  it('attachBackButton wires onClick and returns a detach function', () => {
    const handler = () => {};
    const detach = attachBackButton(handler);
    // biome-ignore lint/style/noNonNullAssertion: Telegram mock is guaranteed installed by beforeEach
    const wa = window.Telegram!.WebApp;
    expect(wa.BackButton.show).toHaveBeenCalled();
    expect(wa.BackButton.onClick).toHaveBeenCalledWith(handler);
    detach();
    expect(wa.BackButton.hide).toHaveBeenCalled();
    expect(wa.BackButton.offClick).toHaveBeenCalledWith(handler);
  });
});

describe('telegram/webapp without WebApp present', () => {
  beforeEach(() => uninstallTelegramMock());
  it('getWebApp returns undefined', () => {
    expect(getWebApp()).toBeUndefined();
  });
  it('getInitData returns empty string', () => {
    expect(getInitData()).toBe('');
  });
  it('applyTelegramTheme is a no-op', () => {
    expect(() => applyTelegramTheme()).not.toThrow();
  });
});
