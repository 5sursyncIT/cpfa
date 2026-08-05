// Copie FR/EN des e-mails transactionnels.
//
// Les templates sont rendus par le worker BullMQ, hors requête HTTP : ils ne
// peuvent pas atteindre le catalogue next-intl. La copie vit donc ici, et
// chaque template reçoit la `locale` du destinataire dans ses props.
//
// Deux e-mails n'apparaissent pas dans ce fichier et restent en français :
// `contact-form` (destiné au personnel du CPFA) et `payment-declared`
// (destiné à la comptabilité). Même règle que le back-office — cf. CLAUDE.md.

import { defaultLocale, formatXofExact, type Locale } from '@cpfa/lib/i18n';

const fr = {
  magicLink: {
    preview: 'Votre lien de connexion CPFA',
    heading: 'Connexion CPFA',
    body: (minutes: number) =>
      `Cliquez sur le bouton ci-dessous pour vous connecter. Ce lien expire dans ${minutes} minutes.`,
    cta: 'Se connecter',
    footer: "Si vous n'avez pas demandé cet email, ignorez-le simplement.",
    subject: 'Votre lien de connexion CPFA',
  },
  convocation: {
    preview: 'Votre convocation officielle CPFA',
    heading: (target: string) => `Convocation — ${target}`,
    greeting: (name: string) => `Bonjour ${name},`,
    body: 'Votre dossier est validé. Vous trouverez ci-joint votre convocation officielle.',
    when: (date: string) => ` La session se tient le ${date}.`,
    where: (place: string) => ` Lieu : ${place}.`,
    cta: 'Télécharger la convocation (PDF)',
    footer:
      "Pensez à présenter cette convocation et une pièce d'identité valide à l'accueil.",
    subject: (target: string) => `Convocation — ${target}`,
  },
  trainerApproved: {
    preview: 'Votre candidature formateur est acceptée — CPFA',
    heading: 'Bienvenue parmi nos formateurs',
    greeting: (name: string) => `Bonjour ${name},`,
    bodyBefore: 'Nous avons le plaisir de vous confirmer que votre candidature a été ',
    bodyStrong: 'acceptée',
    bodyAfter: ". Vous disposez désormais d'un espace dédié sur la plateforme CPFA.",
    cta: 'Accéder à mon espace formateur',
    footer:
      'Vous y retrouverez votre planning, les ressources pédagogiques et la fiche de profil que vous pouvez compléter.',
    subject: 'Votre candidature formateur est acceptée — CPFA',
  },
  trainerRejected: {
    preview: 'Suite donnée à votre candidature formateur — CPFA',
    heading: 'Suite donnée à votre candidature',
    greeting: (name: string) => `Bonjour ${name},`,
    body:
      "Nous vous remercions sincèrement pour l'intérêt que vous portez au CPFA. Après examen attentif de votre dossier, nous ne sommes malheureusement pas en mesure de donner une suite favorable à votre candidature pour le moment.",
    reasonLabel: 'Motif :',
    closing:
      "Cette décision n'est pas définitive — vous pouvez nous adresser une nouvelle candidature à l'avenir si votre situation évolue.",
    footer: "L'équipe pédagogique du CPFA",
    subject: 'Suite donnée à votre candidature formateur — CPFA',
  },
  jobPosted: {
    preview: (jobTitle: string) => `Votre offre « ${jobTitle} » est publiée`,
    heading: 'Votre offre est en ligne',
    greeting: 'Bonjour,',
    bodyBefore: "L'offre ",
    bodyMiddle: ' publiée par ',
    bodyAfter: ' est désormais visible sur le job board du CPFA.',
    cta: "Consulter l'offre en ligne",
    notice:
      "Vous recevrez un email dès qu'une candidature sera déposée, avec les coordonnées du candidat et son CV en lien sécurisé.",
    footer: 'Notification automatique — équipe CPFA.',
    subject: (jobTitle: string) => `Votre offre est en ligne — ${jobTitle}`,
  },
  jobApplicationCandidate: {
    preview: (jobTitle: string) => `Candidature reçue — ${jobTitle}`,
    heading: 'Candidature transmise',
    greeting: (name: string) => `Bonjour ${name},`,
    bodyBefore: 'Votre candidature pour ',
    bodyMiddle: ' chez ',
    bodyAfter:
      ' a bien été transmise au recruteur. Celui-ci reviendra vers vous directement par email ou téléphone selon ses procédures.',
    closing: 'La plateforme CPFA vous remercie pour votre intérêt et vous souhaite bonne chance.',
    footer: 'Notification automatique du job board CPFA.',
    subject: (jobTitle: string) => `Candidature transmise — ${jobTitle}`,
  },
  jobApplicationRecruiter: {
    preview: (jobTitle: string) => `Nouvelle candidature pour « ${jobTitle} »`,
    heading: 'Nouvelle candidature',
    greeting: 'Bonjour,',
    bodyBefore: '',
    bodyMiddle: " a reçu une nouvelle candidature pour l'offre ",
    bodyAfter: '.',
    motivationLabel: 'Motivation',
    cvCta: 'Télécharger le CV (PDF)',
    allApplicationsCta: 'Voir toutes les candidatures sur la plateforme CPFA',
    footer: 'Notification automatique du job board CPFA — ne répondez pas à cet email.',
    subject: (jobTitle: string) => `Nouvelle candidature — ${jobTitle}`,
  },
  receipt: {
    preview: (invoiceNumber: string) => `Reçu N° ${invoiceNumber} — CPFA`,
    heading: 'Paiement confirmé',
    greeting: (name: string) => `Bonjour ${name},`,
    body:
      'Votre paiement a bien été reçu et confirmé par nos services. Vous trouverez en pièce jointe le reçu officiel correspondant.',
    numberLabel: 'N°',
    dateLabel: 'Date',
    purposeLabel: 'Objet',
    amountLabel: 'Montant',
    footer:
      "Si vous avez des questions concernant ce paiement, contactez l'équipe comptable du CPFA.",
    subject: (invoiceNumber: string) => `Reçu N° ${invoiceNumber} — CPFA`,
  },
  subscriptionContract: {
    preview: 'Votre contrat d’abonnement à la bibliothèque du CPFA',
    heading: 'Abonnement activé',
    greeting: (name: string) => `Bonjour ${name},`,
    body:
      'Votre abonnement à la bibliothèque du CPFA est actif. Vous trouverez en pièce jointe votre contrat d’abonnement.',
    tierLabel: 'Formule',
    cardLabel: 'N° de carte',
    validUntilLabel: 'Valable jusqu’au',
    instruction:
      'Merci de l’imprimer, de compléter votre adresse et la date, puis de le signer et de le remettre à l’accueil de la bibliothèque lors de votre prochaine visite.',
    footer: 'Vous pouvez retrouver ce contrat à tout moment depuis votre espace abonné.',
    subject: 'Votre contrat d’abonnement à la bibliothèque — CPFA',
  },
  paymentInstructions: {
    preview: 'Comment régler votre abonnement à la bibliothèque du CPFA',
    heading: 'Régler votre abonnement',
    greeting: (name: string) => `Bonjour ${name},`,
    body: (amount: string) =>
      `Votre demande d’abonnement est enregistrée. Il reste à régler ${amount} par Wave ou Orange Money.`,
    tierLabel: 'Formule',
    amountLabel: 'Montant',
    referenceLabel: 'Référence à indiquer',
    qrNotice:
      'Les QR codes sont joints à ce message : scannez celui de votre opérateur, payez, puis indiquez la référence de la transaction depuis votre espace abonné.',
    footer: 'Votre abonnement est activé dès que la comptabilité a vérifié le paiement.',
    subject: 'Régler votre abonnement à la bibliothèque — CPFA',
  },
  loanReminder: {
    preview: 'Rappel d’échéance — Bibliothèque CPFA',
    headingDue: 'Rappel d’échéance',
    headingOverdue: 'Retour en retard',
    greeting: (name: string) => `Bonjour ${name},`,
    bodyBefore: 'L’ouvrage ',
    bodyMiddle: ' doit être restitué le ',
    bodyAfter: '.',
    overdue: (days: number, penalty: string) =>
      `Retard : ${days} jour(s). Pénalité accumulée : ${penalty}.`,
    footer: 'Merci de passer à la bibliothèque pour le retour.',
  },
};

type Copy = typeof fr;

const en: Copy = {
  magicLink: {
    preview: 'Your CPFA sign-in link',
    heading: 'Sign in to CPFA',
    body: (minutes: number) =>
      `Click the button below to sign in. This link expires in ${minutes} minutes.`,
    cta: 'Sign in',
    footer: 'If you did not request this email, simply ignore it.',
    subject: 'Your CPFA sign-in link',
  },
  convocation: {
    preview: 'Your official CPFA admission letter',
    heading: (target: string) => `Admission letter — ${target}`,
    greeting: (name: string) => `Dear ${name},`,
    body: 'Your application has been approved. Your official admission letter is attached.',
    when: (date: string) => ` The session takes place on ${date}.`,
    where: (place: string) => ` Venue: ${place}.`,
    cta: 'Download the admission letter (PDF)',
    footer: 'Please bring this letter and a valid form of ID to the reception desk.',
    subject: (target: string) => `Admission letter — ${target}`,
  },
  trainerApproved: {
    preview: 'Your trainer application has been accepted — CPFA',
    heading: 'Welcome to our teaching team',
    greeting: (name: string) => `Dear ${name},`,
    bodyBefore: 'We are pleased to confirm that your application has been ',
    bodyStrong: 'accepted',
    bodyAfter: '. You now have a dedicated space on the CPFA platform.',
    cta: 'Go to my trainer space',
    footer:
      'There you will find your schedule, the teaching resources and the profile you can complete.',
    subject: 'Your trainer application has been accepted — CPFA',
  },
  trainerRejected: {
    preview: 'Outcome of your trainer application — CPFA',
    heading: 'Outcome of your application',
    greeting: (name: string) => `Dear ${name},`,
    body:
      'Thank you sincerely for your interest in CPFA. After careful review of your application, we are unfortunately unable to take it further at this time.',
    reasonLabel: 'Reason:',
    closing:
      'This decision is not final — you are welcome to apply again in the future should your circumstances change.',
    footer: 'The CPFA teaching team',
    subject: 'Outcome of your trainer application — CPFA',
  },
  jobPosted: {
    preview: (jobTitle: string) => `Your vacancy "${jobTitle}" is now live`,
    heading: 'Your vacancy is live',
    greeting: 'Hello,',
    bodyBefore: 'The vacancy ',
    bodyMiddle: ' posted by ',
    bodyAfter: ' is now visible on the CPFA job board.',
    cta: 'View the vacancy online',
    notice:
      'You will receive an email as soon as an application is submitted, with the candidate’s contact details and a secure link to their CV.',
    footer: 'Automatic notification — CPFA team.',
    subject: (jobTitle: string) => `Your vacancy is live — ${jobTitle}`,
  },
  jobApplicationCandidate: {
    preview: (jobTitle: string) => `Application received — ${jobTitle}`,
    heading: 'Application submitted',
    greeting: (name: string) => `Dear ${name},`,
    bodyBefore: 'Your application for ',
    bodyMiddle: ' at ',
    bodyAfter:
      ' has been forwarded to the recruiter, who will contact you directly by email or phone in line with their process.',
    closing: 'The CPFA platform thanks you for your interest and wishes you every success.',
    footer: 'Automatic notification from the CPFA job board.',
    subject: (jobTitle: string) => `Application submitted — ${jobTitle}`,
  },
  jobApplicationRecruiter: {
    preview: (jobTitle: string) => `New application for "${jobTitle}"`,
    heading: 'New application',
    greeting: 'Hello,',
    bodyBefore: '',
    bodyMiddle: ' has received a new application for the vacancy ',
    bodyAfter: '.',
    motivationLabel: 'Cover letter',
    cvCta: 'Download the CV (PDF)',
    allApplicationsCta: 'View all applications on the CPFA platform',
    footer: 'Automatic notification from the CPFA job board — please do not reply to this email.',
    subject: (jobTitle: string) => `New application — ${jobTitle}`,
  },
  receipt: {
    preview: (invoiceNumber: string) => `Receipt No. ${invoiceNumber} — CPFA`,
    heading: 'Payment confirmed',
    greeting: (name: string) => `Dear ${name},`,
    body:
      'Your payment has been received and confirmed. The official receipt is attached to this email.',
    numberLabel: 'No.',
    dateLabel: 'Date',
    purposeLabel: 'Purpose',
    amountLabel: 'Amount',
    footer: 'If you have any questions about this payment, contact the CPFA accounts team.',
    subject: (invoiceNumber: string) => `Receipt No. ${invoiceNumber} — CPFA`,
  },
  subscriptionContract: {
    preview: 'Your CPFA library subscription agreement',
    heading: 'Subscription activated',
    greeting: (name: string) => `Dear ${name},`,
    body:
      'Your CPFA library subscription is active. Your subscription agreement is attached to this email.',
    tierLabel: 'Plan',
    cardLabel: 'Card number',
    validUntilLabel: 'Valid until',
    instruction:
      'Please print it, fill in your address and the date, then sign it and hand it in at the library desk on your next visit.',
    footer: 'You can retrieve this agreement at any time from your subscriber account.',
    subject: 'Your library subscription agreement — CPFA',
  },
  paymentInstructions: {
    preview: 'How to pay for your CPFA library subscription',
    heading: 'Pay for your subscription',
    greeting: (name: string) => `Dear ${name},`,
    body: (amount: string) =>
      `Your subscription request has been recorded. ${amount} remains payable by Wave or Orange Money.`,
    tierLabel: 'Plan',
    amountLabel: 'Amount',
    referenceLabel: 'Reference to quote',
    qrNotice:
      'The QR codes are attached to this email: scan the one for your provider, pay, then enter the transaction reference from your subscriber account.',
    footer: 'Your subscription is activated as soon as accounts have verified the payment.',
    subject: 'Pay for your library subscription — CPFA',
  },
  loanReminder: {
    preview: 'Due-date reminder — CPFA Library',
    headingDue: 'Due-date reminder',
    headingOverdue: 'Overdue return',
    greeting: (name: string) => `Dear ${name},`,
    bodyBefore: 'The title ',
    bodyMiddle: ' is due back on ',
    bodyAfter: '.',
    overdue: (days: number, penalty: string) =>
      `${days} day(s) overdue. Accrued late fee: ${penalty}.`,
    footer: 'Please come by the library to return it.',
  },
};

const COPY: Record<Locale, Copy> = { fr, en };

/** Bloc de copie d'un template, dans la langue du destinataire. */
export function emailCopy<K extends keyof Copy>(section: K, locale?: Locale): Copy[K] {
  return (COPY[locale ?? defaultLocale] ?? COPY[defaultLocale])[section];
}

/** Montant FCFA groupé selon la locale — réexporté pour que les templates n'aient qu'un import. */
export { formatXofExact as emailXof };
export type { Locale };
