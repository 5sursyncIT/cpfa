import { expect, test } from '@playwright/test';

const publicPages = [
  { path: '/a-propos', heading: /à propos/i },
  { path: '/mot-du-directeur', heading: /mot du directeur/i },
  { path: '/partenaires', heading: /partenaires/i },
  { path: '/contact', heading: /contactez-nous/i },
];

for (const { path, heading } of publicPages) {
  test(`renders ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  });
}

test('contact form has the expected inputs and submit button', async ({ page }) => {
  await page.goto('/contact');
  await expect(page.getByLabel('Nom complet')).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Sujet')).toBeVisible();
  await expect(page.getByLabel('Message')).toBeVisible();
  await expect(page.getByRole('button', { name: /envoyer le message/i })).toBeVisible();
});

test('client-side validation blocks an empty submit', async ({ page }) => {
  await page.goto('/contact');
  await page.getByRole('button', { name: /envoyer le message/i }).click();
  // Zod fires resolver — at least one error message appears for the required fields.
  await expect(page.locator('span.text-destructive').first()).toBeVisible();
});
