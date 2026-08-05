'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { prisma } from '@cpfa/db';
import { auth } from '@/lib/auth';
import { isLocale, LOCALE_COOKIE } from '@/i18n/request';

// Server action invoked by the locale switcher in the top nav. Persists the
// choice in a long-lived cookie (one year) so subsequent visits open in the
// same language. Triggers a top-level revalidation so RSCs re-render with
// the new messages immediately.
//
// Pour un visiteur connecté, on écrit aussi `User.locale`. Le cookie ne suit
// que le navigateur ; or les e-mails et PDF partent du worker, sans requête ni
// cookie, et souvent sur une action d'un tiers (un admin qui valide un
// dossier). Sans cette colonne, on enverrait au destinataire la langue de
// l'admin. C'est donc elle qui fait foi côté worker.
export async function setLocaleAction(formData: FormData): Promise<void> {
  const locale = formData.get('locale');
  if (!isLocale(locale)) return;
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  const session = await auth();
  if (session?.user?.id) {
    await prisma.user.update({ where: { id: session.user.id }, data: { locale } });
  }

  revalidatePath('/', 'layout');
}
