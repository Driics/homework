type TelegramBackButton = {
  show(): void;
  hide(): void;
  onClick(cb: () => void): void;
  offClick(cb: () => void): void;
};

type TelegramWebApp = {
  initData: string;
  themeParams: Record<string, string>;
  colorScheme: 'light' | 'dark';
  ready(): void;
  expand(): void;
  close(): void;
  BackButton: TelegramBackButton;
  onEvent(event: string, cb: () => void): void;
  offEvent(event: string, cb: () => void): void;
};

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

export function getWebApp(): TelegramWebApp | undefined {
  return typeof window === 'undefined' ? undefined : window.Telegram?.WebApp;
}

export function getInitData(): string {
  return getWebApp()?.initData ?? '';
}

export function applyTelegramTheme(): void {
  const wa = getWebApp();
  if (!wa) return;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(wa.themeParams)) {
    root.style.setProperty(`--tg-${key.replace(/_/g, '-')}`, value);
  }
  // biome-ignore lint/complexity/useLiteralKeys: noPropertyAccessFromIndexSignature requires bracket notation
  root.dataset['theme'] = wa.colorScheme;
}

export function attachBackButton(handler: () => void): () => void {
  const wa = getWebApp();
  if (!wa) return () => {};
  wa.BackButton.show();
  wa.BackButton.onClick(handler);
  return () => {
    wa.BackButton.offClick(handler);
    wa.BackButton.hide();
  };
}

export function callReady(): void {
  getWebApp()?.ready();
}
