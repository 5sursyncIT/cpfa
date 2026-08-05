// UI metadata for the site-settings admin form. The registry (./registry.ts)
// stays the single source of truth for validation (zod) + defaults; this layer
// only describes how to render a friendly form for each key so editors never
// have to touch raw JSON. The server still re-validates every save against the
// registry schema, so this descriptor can be wrong without compromising data
// integrity — at worst a field is mislabelled.

import type { SettingKey } from './registry';

export type FieldType = 'text' | 'textarea' | 'url' | 'email' | 'image' | 'media' | 'number';

export type FieldSpec = {
  name: string;
  label: string;
  type: FieldType;
  optional?: boolean;
  placeholder?: string;
};

export type SettingUi =
  // A single object with a fixed set of fields.
  | { form: 'object'; fields: FieldSpec[] }
  // An ordered list of plain strings (e.g. marquee messages, partner names).
  | { form: 'string-list'; itemLabel: string; multiline?: boolean }
  // An ordered list of objects sharing one shape (testimonials, stats, …).
  | { form: 'object-list'; itemLabel: string; fields: FieldSpec[] };

// Only keys present here are shown in /admin/settings. Content that has its own
// managed entity + admin page (key figures, partners, governance, testimonials)
// is intentionally absent — it's edited there, not as JSON here.
export const settingsUi: Partial<Record<SettingKey, SettingUi>> = {
  'home.hero': {
    form: 'object',
    fields: [
      { name: 'eyebrow', label: 'Sur-titre', type: 'text' },
      { name: 'headline', label: 'Titre principal', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'backgroundImageKey', label: 'Image de fond', type: 'image', optional: true },
    ],
  },

  'home.formationColumns': {
    form: 'object',
    fields: [
      {
        name: 'certificationsImageKey',
        label: 'Colonne « Certifications » — photo de fond',
        type: 'image',
        optional: true,
      },
      {
        name: 'diplomasImageKey',
        label: 'Colonne « Diplômes » — photo de fond',
        type: 'image',
        optional: true,
      },
      {
        name: 'seminarsImageKey',
        label: 'Colonne « Séminaires & concours » — photo de fond',
        type: 'image',
        optional: true,
      },
    ],
  },

  'home.marquee': {
    form: 'string-list',
    itemLabel: 'Message',
  },

  'footer.contact': {
    form: 'object',
    fields: [
      { name: 'address1', label: 'Adresse (ligne 1)', type: 'text' },
      { name: 'address2', label: 'Adresse (ligne 2)', type: 'text' },
      { name: 'phone', label: 'Téléphone', type: 'text' },
      { name: 'email', label: 'E-mail', type: 'email' },
    ],
  },

  'footer.socials': {
    form: 'object',
    fields: [
      { name: 'facebook', label: 'Facebook (URL)', type: 'url', optional: true },
      { name: 'linkedin', label: 'LinkedIn (URL)', type: 'url', optional: true },
      { name: 'instagram', label: 'Instagram (URL)', type: 'url', optional: true },
    ],
  },

  'site.brochureKey': {
    form: 'object',
    fields: [{ name: 'key', label: 'Brochure (PDF)', type: 'media', optional: true }],
  },

  'library.documents': {
    form: 'object',
    fields: [
      { name: 'regulationKey', label: 'Règlement intérieur (PDF)', type: 'media', optional: true },
      {
        name: 'procedureKey',
        label: "Procédure d'abonnement (PDF)",
        type: 'media',
        optional: true,
      },
      {
        name: 'subscriptionFormKey',
        label: "Fiche d'abonnement (PDF)",
        type: 'media',
        optional: true,
      },
    ],
  },

  'home.featured': {
    form: 'object',
    fields: [
      { name: 'eyebrow', label: 'Sur-titre', type: 'text' },
      {
        name: 'headline',
        label: 'Titre — {formations} affiche le nombre réel, *astérisques* pour l’italique',
        type: 'textarea',
      },
      { name: 'cta', label: 'Bouton vers le catalogue', type: 'text' },
      { name: 'emptyTitle', label: 'Titre si aucune formation publiée', type: 'text' },
      { name: 'emptyDescription', label: 'Texte si aucune formation publiée', type: 'textarea' },
      { name: 'emptyAction', label: 'Bouton si aucune formation publiée', type: 'text' },
    ],
  },

  'home.books': {
    form: 'object',
    fields: [
      { name: 'eyebrow', label: 'Sur-titre', type: 'text' },
      {
        name: 'headline',
        label: 'Titre — {ouvrages} affiche le nombre réel de références',
        type: 'textarea',
      },
      { name: 'cta', label: 'Bouton vers le catalogue', type: 'text' },
      { name: 'emptyTitle', label: 'Titre si le catalogue est vide', type: 'text' },
      { name: 'emptyDescription', label: 'Texte si le catalogue est vide', type: 'textarea' },
      { name: 'emptyAction', label: 'Bouton si le catalogue est vide', type: 'text' },
    ],
  },

  'home.concours': {
    form: 'object',
    fields: [
      { name: 'eyebrow', label: 'Sur-titre', type: 'text' },
      { name: 'headline', label: 'Titre (*astérisques* pour l’italique)', type: 'text' },
      { name: 'ctaPrimary', label: 'Bouton principal', type: 'text' },
      { name: 'ctaSecondary', label: 'Bouton secondaire', type: 'text' },
      {
        name: 'fallbackDescription',
        label: 'Description affichée si le concours n’en a pas',
        type: 'textarea',
      },
      { name: 'labelDeposit', label: 'Libellé — clôture des dépôts', type: 'text' },
      { name: 'labelWritten', label: 'Libellé — date des épreuves', type: 'text' },
      { name: 'labelFee', label: 'Libellé — frais de dossier', type: 'text' },
      { name: 'emptyMessage', label: 'Message si aucun concours ouvert', type: 'textarea' },
    ],
  },

  'home.blocks': {
    form: 'object',
    fields: [
      { name: 'aboutEyebrow', label: '1. Qui sommes-nous — sur-titre', type: 'text' },
      { name: 'aboutTitle', label: '1. Qui sommes-nous — titre', type: 'text' },
      { name: 'aboutText', label: '1. Qui sommes-nous — texte', type: 'textarea' },
      { name: 'aboutBrochureCta', label: '1. Bouton brochure', type: 'text' },
      { name: 'aboutDirectorCta', label: '1. Bouton mot du Directeur', type: 'text' },
      { name: 'formationEyebrow', label: '2. Formation — sur-titre', type: 'text' },
      { name: 'formationTitle', label: '2. Formation — titre', type: 'text' },
      {
        name: 'formationColCertifications',
        label: '2. Colonne Certifications — description',
        type: 'text',
      },
      { name: 'formationColDiplomas', label: '2. Colonne Diplômes — description', type: 'text' },
      {
        name: 'formationColSeminars',
        label: '2. Colonne Séminaires & concours — description',
        type: 'text',
      },
      { name: 'upcomingEyebrow', label: '3. À venir — sur-titre', type: 'text' },
      { name: 'upcomingTitle', label: '3. À venir — titre', type: 'text' },
      { name: 'upcomingEmpty', label: '3. À venir — message si rien de programmé', type: 'text' },
      { name: 'libraryEyebrow', label: '4. Bibliothèque — sur-titre', type: 'text' },
      { name: 'libraryTitle', label: '4. Bibliothèque — titre', type: 'text' },
      {
        name: 'libraryText',
        label:
          '4. Bibliothèque — texte. Jetons : {ouvrages}, {tarifEtudiant}, {tarifPro}, {tarifEmprunt}',
        type: 'textarea',
      },
      { name: 'libraryCatalogCta', label: '4. Bouton catalogue', type: 'text' },
      { name: 'librarySubscribeCta', label: '4. Bouton abonnement', type: 'text' },
    ],
  },

  'home.testimonialsSection': {
    form: 'object',
    fields: [
      { name: 'eyebrow', label: 'Sur-titre (au-dessus du titre)', type: 'text' },
      {
        name: 'headline',
        label: 'Titre — mettez *entre astérisques* la partie en italique orange',
        type: 'textarea',
      },
      {
        name: 'emptyTitle',
        label: 'Titre affiché tant qu’aucun témoignage n’est publié',
        type: 'text',
      },
      {
        name: 'emptyDescription',
        label: 'Texte affiché tant qu’aucun témoignage n’est publié',
        type: 'textarea',
      },
    ],
  },

  'library.pricing': {
    form: 'object',
    fields: [
      { name: 'studentXof', label: 'Abonnement étudiant (FCFA / an)', type: 'number' },
      { name: 'professionalXof', label: 'Abonnement professionnel (FCFA / an)', type: 'number' },
      {
        name: 'homeLoanFeeXof',
        label: 'Emprunt à domicile — droit d’abonnement (FCFA / an)',
        type: 'number',
      },
      {
        name: 'homeLoanDepositXof',
        label: 'Emprunt à domicile — caution remboursable (FCFA)',
        type: 'number',
      },
    ],
  },

  'payments.mobileMoney': {
    form: 'object',
    fields: [
      { name: 'waveQrKey', label: 'QR code Wave (image)', type: 'image', optional: true },
      {
        name: 'waveNumber',
        label: 'Numéro Wave (si la personne ne peut pas scanner)',
        type: 'text',
        optional: true,
        placeholder: '+221 77 000 00 00',
      },
      {
        name: 'orangeQrKey',
        label: 'QR code Orange Money (image)',
        type: 'image',
        optional: true,
      },
      {
        name: 'orangeNumber',
        label: 'Numéro Orange Money (si la personne ne peut pas scanner)',
        type: 'text',
        optional: true,
        placeholder: '+221 77 000 00 00',
      },
      {
        name: 'instructions',
        label: 'Consigne affichée sous les QR codes',
        type: 'textarea',
        optional: true,
      },
      {
        name: 'accountingEmail',
        label: 'E-mail de la comptabilité (alerte à chaque paiement déclaré)',
        type: 'email',
        optional: true,
      },
    ],
  },

  'library.contract': {
    form: 'object',
    fields: [
      { name: 'libraryAddress', label: 'Adresse de la bibliothèque', type: 'text' },
      { name: 'managerName', label: 'Gérante (ou gérant) de la bibliothèque', type: 'text' },
      { name: 'city', label: 'Ville où le contrat est signé', type: 'text' },
    ],
  },

  'teaching.charterKey': {
    form: 'object',
    fields: [{ name: 'key', label: "Charte de l'enseignant (PDF)", type: 'media', optional: true }],
  },
};
