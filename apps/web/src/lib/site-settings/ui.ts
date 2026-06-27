// UI metadata for the site-settings admin form. The registry (./registry.ts)
// stays the single source of truth for validation (zod) + defaults; this layer
// only describes how to render a friendly form for each key so editors never
// have to touch raw JSON. The server still re-validates every save against the
// registry schema, so this descriptor can be wrong without compromising data
// integrity — at worst a field is mislabelled.

import type { SettingKey } from './registry';

export type FieldType = 'text' | 'textarea' | 'url' | 'email' | 'image' | 'media';

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
      { name: 'backgroundImageKey', label: "Image de fond", type: 'image', optional: true },
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
      { name: 'procedureKey', label: "Procédure d'abonnement (PDF)", type: 'media', optional: true },
      {
        name: 'subscriptionFormKey',
        label: "Fiche d'abonnement (PDF)",
        type: 'media',
        optional: true,
      },
    ],
  },

  'teaching.charterKey': {
    form: 'object',
    fields: [{ name: 'key', label: "Charte de l'enseignant (PDF)", type: 'media', optional: true }],
  },
};
