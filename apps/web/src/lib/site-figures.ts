// Les chiffres que la page d'accueil annonce doivent être ceux du site, pas des
// nombres écrits à la main dans une traduction. Tout ce qui se compte est
// compté ici, une fois par rendu, puis injecté dans les textes éditables via
// des jetons ({ouvrages}, {formations}, …).
//
// Un texte sans jeton reste du texte : l'administration garde la main sur la
// formulation, le système garantit seulement l'exactitude des nombres.

import { prisma } from '@cpfa/db';

export type SiteFigures = {
  /** Références au catalogue de la bibliothèque. */
  ouvrages: number;
  /** Formations publiées (diplômantes + certifiantes). */
  formations: number;
  /** Séminaires publiés encore à venir. */
  seminaires: number;
  /** Concours publiés encore ouverts. */
  concours: number;
  /** Abonnés actifs de la bibliothèque. */
  abonnes: number;
};

const EMPTY: SiteFigures = { ouvrages: 0, formations: 0, seminaires: 0, concours: 0, abonnes: 0 };

export async function getSiteFigures(now: Date = new Date()): Promise<SiteFigures> {
  try {
    const [ouvrages, formations, seminaires, concours, abonnes] = await Promise.all([
      prisma.resource.count(),
      prisma.course.count({ where: { published: true } }),
      prisma.seminar.count({ where: { published: true, startsAt: { gte: now } } }),
      prisma.exam.count({ where: { published: true, closeAt: { gte: now } } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    ]);
    return { ouvrages, formations, seminaires, concours, abonnes };
  } catch (err) {
    // Base injoignable : mieux vaut une phrase sans nombre qu'une page en
    // erreur — applyFigures laissera le jeton vide.
    console.warn('[site-figures] count failed — figures unavailable.', err);
    return EMPTY;
  }
}

/** 4200 → « 4 200 » (espaces insécables fines évitées : le mono du site les rend mal). */
export function formatFigure(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Remplace les jetons d'un texte éditable par les chiffres réels.
 * « {ouvrages} ouvrages en accès abonné » → « 498 ouvrages en accès abonné ».
 * Un jeton inconnu est laissé tel quel, pour que la faute de frappe se voie.
 */
export function applyFigures(text: string, figures: SiteFigures): string {
  return text.replace(/\{(\w+)\}/g, (match, token: string) => {
    const value = (figures as Record<string, number | undefined>)[token];
    return value === undefined ? match : formatFigure(value);
  });
}
