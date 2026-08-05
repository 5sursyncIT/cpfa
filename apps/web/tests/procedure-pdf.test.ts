import { describe, expect, it } from 'vitest';
import { renderProcedure } from '@cpfa/pdf';
import { getSubscriptionProcedure } from '@/lib/subscription-procedure';

// Garde-fou du téléchargement /bibliotheque/abonnement/procedure.pdf : le
// document officiel doit se rendre dans les deux langues, sans dépendre d'un
// PDF déposé en médiathèque.
describe('subscription procedure PDF', () => {
  for (const locale of ['fr', 'en'] as const) {
    it(`renders the ${locale} document`, async () => {
      const doc = getSubscriptionProcedure(locale);
      const buffer = await renderProcedure({
        title: doc.title,
        subtitle: doc.subtitle,
        intro: doc.intro,
        sections: doc.sections,
        closing: doc.closing,
        tagline: doc.tagline,
        signature: doc.signature,
      });
      expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
      expect(buffer.length).toBeGreaterThan(5_000);
    });
  }
});
