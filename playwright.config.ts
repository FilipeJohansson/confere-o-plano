import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  // No CI também gera o relatório HTML, enviado como artefato quando algum teste falha.
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  forbidOnly: !!process.env.CI,
  use: {
    baseURL: 'http://localhost:4321',
    // Permite usar um Chromium já instalado (ex.: ambiente sem download de navegadores).
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  // Serve dist/ como o Cloudflare Pages (wrangler pages dev): os testes passam pelos cabeçalhos de public/_headers
  // (CSP), pela página 404 e pelo redirecionamento para a barra final.
  webServer: {
    command: 'pnpm exec wrangler pages dev --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: true,
    env: { WRANGLER_SEND_METRICS: 'false' },
  },
  projects: [
    { name: 'celular', use: { viewport: { width: 390, height: 844 } } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
  ],
});
