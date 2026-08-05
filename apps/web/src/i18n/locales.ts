// Locales et constantes associées, isolées de `./request` : ce dernier importe
// `next/headers`, ce qui le rend inutilisable hors requête HTTP (worker BullMQ,
// scripts). Tout ce qui a seulement besoin de connaître les locales importe
// ici ; `./request` les ré-exporte pour ne casser aucun appel existant.
//
// La définition elle-même vit dans `@cpfa/lib/i18n`, partagée avec les
// templates e-mail et les PDF : une seule liste de locales pour tout le
// monorepo. On la ré-exporte ici parce que tout le code web la cherche déjà à
// cette adresse.

export {
  locales,
  defaultLocale,
  isLocale,
  intlLocale,
  type Locale,
} from '@cpfa/lib/i18n';

// Propre au web : le cookie que pose le switcher de langue du top-nav.
export const LOCALE_COOKIE = 'NEXT_LOCALE';
