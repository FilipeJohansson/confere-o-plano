// As prévias da Cloudflare (*.pages.dev) usam o mesmo build de produção; nelas nada pode ser contado.
import { expect, test } from './base';

// Faz "previa.pages.test" apontar para o servidor local, como se fosse uma prévia da Cloudflare.
test.use({
  launchOptions: {
    ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}),
    args: ['--host-resolver-rules=MAP previa.pages.test 127.0.0.1'],
  },
});

test('em endereço de prévia, o script de contagem não é carregado e nada é contado', async ({ page, contagens }) => {
  await page.goto('http://previa.pages.test:4321/');
  await expect(page.getByRole('link', { name: 'Começar' })).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(await page.locator('script[src*="gc.zgo.at"]').count()).toBe(0);
  expect(contagens).toEqual([]);
});
