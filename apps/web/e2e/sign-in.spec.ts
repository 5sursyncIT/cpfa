import { expect, test } from '@playwright/test';

test('sign-in page exposes Google + credentials forms', async ({ page }) => {
  await page.goto('/sign-in');
  await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /continuer avec google/i })).toBeVisible();
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
  await expect(page.getByRole('button', { name: /^se connecter$/i })).toBeVisible();
});

test('protected /admin redirects to sign-in when unauthenticated', async ({ page }) => {
  const response = await page.goto('/admin');
  // Auth.js redirects unauth'd to the configured signIn page (/sign-in).
  expect(page.url()).toContain('/sign-in');
  expect(response?.ok()).toBe(true);
});
