import { renderProcedure } from '@cpfa/pdf';
import { resolveLocale } from '@/i18n/request';
import { getSetting } from '@/lib/site-settings/get';
import { mediaUrl } from '@/lib/media';
import { getSubscriptionProcedure } from '@/lib/subscription-procedure';
import { getLibraryTiers } from '@/lib/library-pricing';

export const dynamic = 'force-dynamic';

// Téléchargement de la « Procédure d'abonnement annuel à la bibliothèque ».
//
// Si un PDF officiel a été déposé dans la médiathèque et rattaché au réglage
// « Bibliothèque — documents officiels », c'est lui qui est servi : le document
// signé prime toujours. Sinon on rend à la volée le même texte que la page
// /bibliotheque/abonnement, pour que le lien ne soit jamais mort.
export async function GET(request: Request) {
  const [locale, documents] = await Promise.all([resolveLocale(), getSetting('library.documents')]);

  const officialUrl = mediaUrl(documents.procedureKey);
  if (officialUrl) {
    return Response.redirect(new URL(officialUrl, request.url), 302);
  }

  const doc = getSubscriptionProcedure(locale, await getLibraryTiers(locale));
  const generatedOn = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', {
    dateStyle: 'long',
  }).format(new Date());

  const pdf = await renderProcedure({
    title: doc.title,
    subtitle: doc.subtitle,
    intro: doc.intro,
    sections: doc.sections,
    closing: doc.closing,
    tagline: doc.tagline,
    signature: doc.signature,
    footnote:
      locale === 'en'
        ? `Document generated from cpfa-sn.com on ${generatedOn}.`
        : `Document généré depuis cpfa-sn.com le ${generatedOn}.`,
  });

  const filename =
    locale === 'en'
      ? 'cpfa-library-subscription-procedure.pdf'
      : 'cpfa-procedure-abonnement-bibliotheque.pdf';

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      // Court, pour que le basculement vers un PDF officiel déposé par
      // l'administration se voie tout de suite.
      'Cache-Control': 'public, max-age=300',
    },
  });
}
