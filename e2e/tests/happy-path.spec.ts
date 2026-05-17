import { expect, test } from '@playwright/test';
import { signInitData } from './fixtures/initData.js';

// biome-ignore lint/complexity/useLiteralKeys: TS noPropertyAccessFromIndexSignature requires bracket notation for process.env
const BOT_TOKEN = process.env['TELEGRAM_BOT_TOKEN'] ?? '000000:fake-token-for-local-smoke-test';

test('login → cards → detail → logout', async ({ page }) => {
  const signed = signInitData({ botToken: BOT_TOKEN, userId: 12345, firstName: 'Alice' });

  // Block Telegram's WebApp library so it can't overwrite our stub after addInitScript runs.
  await page.route('**/telegram-web-app.js', (route) =>
    route.fulfill({ body: '', contentType: 'application/javascript' }),
  );

  await page.addInitScript((initData: string) => {
    (window as unknown as { Telegram: unknown }).Telegram = {
      WebApp: {
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
        ready: () => {},
        expand: () => {},
        close: () => {},
        BackButton: { show: () => {}, hide: () => {}, onClick: () => {}, offClick: () => {} },
        onEvent: () => {},
        offEvent: () => {},
      },
    };
  }, signed.initData);

  await page.goto('/');
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();

  await page.getByLabel(/email/i).fill('alice@example.com');
  await page.getByLabel(/password/i).fill('Passw0rd!');
  await page.getByRole('button', { name: /log in/i }).click();

  await expect(page.getByText(/Your cards/)).toBeVisible({ timeout: 10_000 });
  const firstCard = page.getByRole('link', { name: /\*\*\*\* \*\*\*\* \*\*\*\*/ }).first();
  await expect(firstCard).toBeVisible();

  await firstCard.click();
  await expect(page.getByText('Ledger')).toBeVisible();
  await expect(page.getByText('Available')).toBeVisible();

  await page.goto('/cards');
  await page.getByRole('button', { name: /log out/i }).click();
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible({
    timeout: 10_000,
  });
});
