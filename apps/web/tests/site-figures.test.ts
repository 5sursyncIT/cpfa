import { describe, expect, it } from 'vitest';
import { applyFigures, formatFigure, type SiteFigures } from '@/lib/site-figures';

const figures: SiteFigures = {
  ouvrages: 498,
  formations: 2,
  seminaires: 1,
  concours: 1,
  abonnes: 37,
};

// Les textes de la page d'accueil sont saisis en back-office ; les nombres
// qu'ils annoncent viennent du catalogue, jamais d'une valeur recopiée.
describe('site figures', () => {
  it('groups thousands the way the site writes them', () => {
    expect(formatFigure(498)).toBe('498');
    expect(formatFigure(3200)).toBe('3 200');
    expect(formatFigure(1234567)).toBe('1 234 567');
  });

  it('replaces every known token', () => {
    expect(applyFigures('{ouvrages} ouvrages, {formations} formations', figures)).toBe(
      '498 ouvrages, 2 formations',
    );
    expect(applyFigures('Bibliothèque · {ouvrages} références', figures)).toBe(
      'Bibliothèque · 498 références',
    );
  });

  // Une faute de frappe doit se voir dans l'aperçu, pas disparaître en silence.
  it('leaves an unknown token untouched', () => {
    expect(applyFigures('{diplomes} diplômés', figures)).toBe('{diplomes} diplômés');
  });

  it('leaves a text without token untouched', () => {
    expect(applyFigures('Reconnu par la Direction des Assurances', figures)).toBe(
      'Reconnu par la Direction des Assurances',
    );
  });

  it('renders zero as zero rather than dropping the sentence', () => {
    const empty: SiteFigures = {
      ouvrages: 0,
      formations: 0,
      seminaires: 0,
      concours: 0,
      abonnes: 0,
    };
    expect(applyFigures('{ouvrages} références', empty)).toBe('0 références');
  });
});
