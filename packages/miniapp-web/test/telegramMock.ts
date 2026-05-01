import { vi } from 'vitest';

export type FakeBackButton = {
  show: ReturnType<typeof vi.fn>;
  hide: ReturnType<typeof vi.fn>;
  onClick: ReturnType<typeof vi.fn>;
  offClick: ReturnType<typeof vi.fn>;
};

export type FakeWebApp = {
  initData: string;
  themeParams: Record<string, string>;
  colorScheme: 'light' | 'dark';
  ready: ReturnType<typeof vi.fn>;
  expand: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  BackButton: FakeBackButton;
  onEvent: ReturnType<typeof vi.fn>;
  offEvent: ReturnType<typeof vi.fn>;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp: FakeWebApp;
    };
  }
}

export function installTelegramMock(
  initData = 'query_id=AAH&user=%7B%22id%22%3A1%7D&hash=abc',
): FakeWebApp {
  const webApp: FakeWebApp = {
    initData,
    themeParams: {
      bg_color: '#ffffff',
      text_color: '#111111',
      button_color: '#3390ec',
      button_text_color: '#ffffff',
      hint_color: '#999999',
      destructive_text_color: '#dc3545',
    },
    colorScheme: 'light',
    ready: vi.fn(),
    expand: vi.fn(),
    close: vi.fn(),
    BackButton: {
      show: vi.fn(),
      hide: vi.fn(),
      onClick: vi.fn(),
      offClick: vi.fn(),
    },
    onEvent: vi.fn(),
    offEvent: vi.fn(),
  };
  Object.defineProperty(window, 'Telegram', {
    value: { WebApp: webApp },
    writable: true,
    configurable: true,
  });
  return webApp;
}

export function uninstallTelegramMock(): void {
  Object.defineProperty(window, 'Telegram', {
    value: undefined,
    writable: true,
    configurable: true,
  });
}
