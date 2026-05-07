import { expect, test } from '@playwright/test';

test('home page renders the hero with two CTAs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: /voir les formations/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /accéder à la bibliothèque/i })).toBeVisible();
});

test('header exposes the public navigation', async ({ page }) => {
  await page.goto('/');
  for (const label of ['Accueil', 'Formations', 'Séminaires', 'Bibliothèque', 'Concours', 'Contact']) {
    await expect(page.getByRole('link', { name: label, exact: true })).toBeVisible();
  }
});

test('footer lists the institution + activity columns', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Institution')).toBeVisible();
  await expect(page.getByText('Activités')).toBeVisible();
  await expect(page.getByText('Ressources').first()).toBeVisible();
});
