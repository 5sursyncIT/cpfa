// Accès serveur à la grille tarifaire de la bibliothèque.
//
// Les montants sont réglables dans /admin/settings (`library.pricing`) ; tout
// ce qui affiche ou encaisse un prix passe par ici, jamais par la constante
// LIBRARY_TIERS directement — sinon un écran finirait par annoncer un tarif que
// la caisse n'applique plus.
//
// Utilise readSetting (sans `next/headers`) pour rester appelable depuis le
// worker BullMQ, qui rend le contrat d'abonnement.

import { buildLibraryTiers, type LibraryPricing, type LibraryTier } from './library-rules';
import { readSetting } from './site-settings/read';
import type { SubscriptionTier } from './library-rules';
import type { Locale } from '@/i18n/locales';

export type LibraryTiers = Record<SubscriptionTier, LibraryTier>;

export async function getLibraryPricing(locale: Locale = 'fr'): Promise<LibraryPricing> {
  return readSetting('library.pricing', locale);
}

export async function getLibraryTiers(locale: Locale = 'fr'): Promise<LibraryTiers> {
  return buildLibraryTiers(await getLibraryPricing(locale));
}
