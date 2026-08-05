// Langue d'un destinataire d'e-mail ou de PDF.
//
// La règle : c'est TOUJOURS la langue du destinataire qui décide, jamais celle
// de la requête. Beaucoup de nos envois sont déclenchés par un tiers — un
// admin qui valide un dossier, un candidat qui postule à une offre — et la
// locale de ce tiers n'a aucun rapport avec celle de la personne qui recevra
// le message.
//
// `User.locale` est alimenté par le sélecteur de langue
// ([`app/actions/set-locale.ts`](../app/actions/set-locale.ts)). La colonne a
// `@default("fr")`, donc un compte qui n'a jamais touché au sélecteur reçoit
// du français — le comportement d'avant.

import { prisma } from '@cpfa/db';
import { defaultLocale, isLocale, type Locale } from '@cpfa/lib/i18n';

/** Normalise la colonne `User.locale` (un `String` libre côté Prisma). */
export function recipientLocale(user: { locale?: string | null } | null | undefined): Locale {
  return isLocale(user?.locale) ? user.locale : defaultLocale;
}

/**
 * Langue à utiliser pour un e-mail, résolue à l'envoi depuis l'adresse du
 * destinataire.
 *
 * Le worker appelle ceci pour chaque message : la préférence enregistrée du
 * destinataire l'emporte toujours. `fallback` ne sert que pour les adresses
 * sans compte — un recruteur qui dépose une offre sans s'inscrire, un candidat
 * anonyme — et vaut alors la locale de la requête qui a enfilé le job.
 */
export async function localeForEmail(email: string, fallback?: Locale): Promise<Locale> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { locale: true },
    });
    if (user) return recipientLocale(user);
  } catch {
    // Une panne de lecture ne doit pas empêcher l'envoi : on retombe sur le
    // fallback, exactement comme pour une adresse sans compte.
  }
  return fallback ?? defaultLocale;
}
