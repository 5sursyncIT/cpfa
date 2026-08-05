import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderEmph } from '@/lib/render-emph';

const html = (input: string | null | undefined) => renderToStaticMarkup(<>{renderEmph(input)}</>);

// Le back-office saisit du texte simple : `*…*` pour l'italique de marque et de
// vrais retours à la ligne. Aucune balise à taper, aucun HTML à interpréter.
describe('renderEmph', () => {
  it('wraps starred segments in the brand italic', () => {
    expect(html('Ils ont étudié au CPFA *— et l’ont prouvé.*')).toBe(
      'Ils ont étudié au CPFA <em class="italic-emph">— et l’ont prouvé.</em>',
    );
  });

  it('turns newlines into line breaks, inside and outside the emphasis', () => {
    expect(html('Ils ont étudié au CPFA\n*— et l’ont prouvé.*')).toBe(
      'Ils ont étudié au CPFA<br/><em class="italic-emph">— et l’ont prouvé.</em>',
    );
    expect(html('*deux\nlignes*')).toBe('<em class="italic-emph">deux<br/>lignes</em>');
  });

  it('leaves plain text untouched and tolerates empty input', () => {
    expect(html('Voix d’alumni')).toBe('Voix d’alumni');
    expect(html('')).toBe('');
    expect(html(null)).toBe('');
  });

  // Une astérisque isolée est du texte, pas une balise ouverte.
  it('does not swallow a lone asterisk', () => {
    expect(html('3 200 références *')).toBe('3 200 références *');
  });
});
