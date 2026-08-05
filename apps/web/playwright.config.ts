import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.APP_URL ?? 'http://localhost:3001';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  // `pnpm dev` sert sur :3001 — l'URL doit être la même pour les tests et pour
  // le webServer, sinon Playwright attend un serveur qui ne viendra jamais.
  use: {
    baseURL,
    // Les assertions portent sur la copie FR : sans cela Chromium annonce
    // `Accept-Language: en-US` et resolveLocale() sert le site en anglais.
    locale: 'fr-FR',
    extraHTTPHeaders: { 'Accept-Language': 'fr-FR,fr;q=0.9' },
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
