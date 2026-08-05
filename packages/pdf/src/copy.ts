// Copie FR/EN des documents PDF opérationnels — carte d'abonné, reçu,
// convocation. Même raison d'être que `packages/emails/src/copy.ts` : ces
// documents sont rendus par le worker BullMQ, hors requête HTTP, donc hors de
// portée du catalogue next-intl.
//
// Deux PDF n'apparaissent pas ici :
//   - `subscription-contract` reproduit un contrat papier signé et reste en
//     français (voir le commentaire dans le worker) ;
//   - `procedure` tire déjà son texte FR+EN de
//     `apps/web/src/lib/subscription-procedure.ts`.

import { defaultLocale, type Locale } from '@cpfa/lib/i18n';

const fr = {
  card: {
    title: 'CPFA — Bibliothèque',
    holder: 'Titulaire',
    cardNumber: 'N° Carte',
    validUntil: 'Valide jusqu’au',
  },
  invoice: {
    title: (number: string) => `Reçu N° ${number}`,
    customer: 'Client',
    date: 'Date',
    description: 'Description',
    total: 'Total :',
  },
  convocation: {
    brand: 'CPFA — Centre Professionnel de Formation à l’Assurance',
    brandSub: 'Dakar, Sénégal',
    title: 'Convocation officielle',
    reference: (id: string) => `Référence : ${id}`,
    candidate: 'Candidat·e',
    subject: 'Objet',
    date: 'Date',
    place: 'Lieu',
    kindCourse: 'Formation',
    kindSeminar: 'Séminaire',
    kindExam: 'Concours / Examen',
    body: 'Vous êtes officiellement convoqué·e pour la session ci-dessus. Présentez ce document ainsi qu’une pièce d’identité valide à l’accueil.',
    signature: 'La Direction des études — CPFA',
  },
};

type PdfCopy = typeof fr;

const en: PdfCopy = {
  card: {
    title: 'CPFA — Library',
    holder: 'Holder',
    cardNumber: 'Card no.',
    validUntil: 'Valid until',
  },
  invoice: {
    title: (number: string) => `Receipt No. ${number}`,
    customer: 'Customer',
    date: 'Date',
    description: 'Description',
    total: 'Total:',
  },
  convocation: {
    brand: 'CPFA — Professional Training Centre for the Insurance Industry',
    brandSub: 'Dakar, Senegal',
    title: 'Official admission letter',
    reference: (id: string) => `Reference: ${id}`,
    candidate: 'Candidate',
    subject: 'Subject',
    date: 'Date',
    place: 'Venue',
    kindCourse: 'Course',
    kindSeminar: 'Seminar',
    kindExam: 'Entrance examination',
    body: 'You are formally invited to attend the session above. Please bring this document and a valid form of ID to the reception desk.',
    signature: 'CPFA — Office of Academic Affairs',
  },
};

const COPY: Record<Locale, PdfCopy> = { fr, en };

export function pdfCopy<K extends keyof PdfCopy>(section: K, locale?: Locale): PdfCopy[K] {
  return (COPY[locale ?? defaultLocale] ?? COPY[defaultLocale])[section];
}

export type { Locale };
