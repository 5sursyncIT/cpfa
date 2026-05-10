'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { isLocale, LOCALE_COOKIE } from '@/i18n/request';

// Server action invoked by the locale switcher in the top nav. Persists the
// choice in a long-lived cookie (one year) so subsequent visits open in the
// same language. Triggers a top-level revalidation so RSCs re-render with
// the new messages immediately.
export async function setLocaleAction(formData: FormData): Promise<void> {
  const locale = formData.get('locale');
  if (!isLocale(locale)) return;
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  revalidatePath('/', 'layout');
}
