// Messages d'erreur tRPC qui remontent tels quels dans l'interface visiteur.
//
// Ils ne peuvent pas vivre dans `messages/*.json` : next-intl résout ses
// catalogues à partir du contexte de rendu, alors que ces chaînes sont
// produites dans un route handler, avant tout rendu. On les garde donc ici,
// indexés par locale, sur le même modèle que `subscription-procedure.ts`.
//
// Ne mettre ici QUE les erreurs vues par un visiteur ou un abonné. Le
// back-office reste en français (cf. CLAUDE.md) : ses erreurs restent écrites
// en clair dans les routers.

import { defaultLocale, type Locale } from '@cpfa/lib/i18n';

const MESSAGES = {
  fr: {
    seminarFull: 'Séminaire complet.',
    registrationsClosed: 'Inscriptions fermées.',
    applicationsReopenOn: 'Inscriptions fermées — réouverture le {date}.',
    applicationsClosedForSession: 'Inscriptions fermées pour cette session.',
    examRegistrationRequired: 'Inscription requise pour cette épreuve.',
    attachmentsClosed: 'Cette inscription ne peut plus recevoir de pièces.',
    subscriptionAlreadyActive: 'Un abonnement actif existe déjà.',
    jobClosed: 'Cette offre n’est plus ouverte aux candidatures.',
    approvedTrainersOnly: 'Réservé aux formateurs validés.',
    alreadyTrainer: 'Vous êtes déjà formateur — modifiez votre fiche depuis votre espace.',
    paymentProviderUnavailable:
      'Le service de paiement est momentanément indisponible. Réessayez dans quelques instants.',
  },
  en: {
    seminarFull: 'This seminar is fully booked.',
    registrationsClosed: 'Registrations are closed.',
    applicationsReopenOn: 'Applications closed — they reopen on {date}.',
    applicationsClosedForSession: 'Applications are closed for this intake.',
    examRegistrationRequired: 'You must be registered for this examination.',
    attachmentsClosed: 'This application can no longer accept documents.',
    subscriptionAlreadyActive: 'An active subscription already exists.',
    jobClosed: 'This vacancy is no longer open to applications.',
    approvedTrainersOnly: 'Restricted to approved trainers.',
    alreadyTrainer: 'You are already a trainer — edit your profile from your account.',
    paymentProviderUnavailable:
      'The payment service is temporarily unavailable. Please try again in a moment.',
  },
} satisfies Record<Locale, Record<string, string>>;

export type ServerErrorKey = keyof (typeof MESSAGES)['fr'];

export function serverError(
  key: ServerErrorKey,
  locale: Locale = defaultLocale,
  params?: Record<string, string | number>,
): string {
  const template = MESSAGES[locale]?.[key] ?? MESSAGES[defaultLocale][key];
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
