// Site-wide settings registry — the single source of truth for editable
// content that doesn't fit a CMS Page. Each key has:
//   - a zod schema (server-side validation in cms.settings.set)
//   - a TS type (inferred via z.infer)
//   - a default (used as fallback when no DB row exists)
//   - a UI hint (kind + label) so the admin form can render the right editor
//
// Adding a new setting:
//   1. Append to KNOWN_SETTINGS below
//   2. The admin /admin/settings page picks it up automatically
//   3. Read it from a server component via getSetting(key)
//
// The DB column is `value` Json; the application layer enforces the shape.
// We never trust DB rows blindly — every read goes through schema.parse() so
// a malformed row falls back to the default rather than crashing.

import { z } from 'zod';

// ── Reusable shapes ─────────────────────────────────────────────────────
const testimonialSchema = z.object({
  quote: z.string().min(1).max(500),
  name: z.string().min(1).max(120),
  role: z.string().min(1).max(160),
});

const statSchema = z.object({
  value: z.string().min(1).max(20),
  sup: z.string().max(20).optional().default(''),
  label: z.string().min(1).max(80),
});

const governanceMemberSchema = z.object({
  role: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  note: z.string().max(160).optional().default(''),
});

// ── Known keys ──────────────────────────────────────────────────────────
export const settingsRegistry = {
  'home.hero': {
    label: "Page d'accueil — bandeau",
    kind: 'object' as const,
    schema: z.object({
      eyebrow: z.string().max(120),
      headline: z.string().max(300),
      description: z.string().max(800),
      backgroundImageKey: z.string().max(400).optional().default(''),
    }),
    default: {
      eyebrow: 'Unité décentralisée de l’IIA Yaoundé',
      headline: 'Formez-vous aux métiers de l’assurance.',
      description:
        "Diplômes (DTA, BTS), certifications spécialisées, séminaires et bibliothèque dédiée — au service des professionnels et des étudiants de la zone CIMA.",
      backgroundImageKey: '',
    },
  },

  'home.marquee': {
    label: 'Page d’accueil — bandeau défilant',
    kind: 'array' as const,
    schema: z.array(z.string().trim().min(1).max(160)).max(20),
    default: [
      "Concours d'entrée 2026 · Inscriptions ouvertes",
      'Nouveau : Certificat Bancassurance',
      'Séminaire CIMA · 14 juin',
      'Bibliothèque · 3 200 références',
      'Partenariat Institut des Actuaires',
    ],
  },

  'home.testimonials': {
    label: 'Page d’accueil — témoignages',
    kind: 'array' as const,
    schema: z.array(testimonialSchema).max(10),
    default: [
      {
        quote:
          "Le CPFA m'a ouvert les portes de la direction technique d'une grande compagnie panafricaine. Les cas pratiques étaient redoutablement réalistes.",
        name: 'Aïssatou Ndiaye',
        role: 'Directrice Technique · NSIA Assurances',
      },
      {
        quote:
          "Ce que j'ai apprécié, c'est la rigueur académique alliée à une lecture profonde du contexte ouest-africain. C'est rare.",
        name: 'Cheikh A. Bâ',
        role: 'Inspecteur · Direction des Assurances',
      },
      {
        quote:
          "La bibliothèque seule justifie l'inscription. Aucun autre fonds documentaire spécialisé ne s'en approche dans la sous-région.",
        name: 'Marie-Louise Sagna',
        role: 'Doctorante · UCAD',
      },
    ],
  },

  'home.stats': {
    label: 'Page d’accueil — chiffres-clés',
    kind: 'array' as const,
    schema: z.array(statSchema).max(8),
    default: [
      { value: '30', sup: 'ans', label: 'Au service du secteur' },
      { value: '4 200', sup: '+', label: 'Diplômés actifs' },
      { value: '14', sup: '', label: "Pays d'Afrique représentés" },
      { value: '96', sup: '%', label: "Taux d'insertion 12 mois" },
    ],
  },

  'about.governance': {
    label: 'À propos — gouvernance',
    kind: 'array' as const,
    schema: z.array(governanceMemberSchema).max(20),
    default: [
      {
        role: 'Direction générale',
        name: 'El Hadji Cheikhou Oumar SECK',
        note: 'Directeur — CPFA',
      },
    ],
  },

  'about.partners': {
    label: 'À propos — partenaires (logos / noms)',
    kind: 'array' as const,
    schema: z.array(z.string().min(1).max(120)).max(60),
    default: [
      'IIA Yaoundé',
      'Direction des Assurances (DNA)',
      'FSSA',
      'PF2E',
      'PNUD',
      'Cabinet CASAI',
    ],
  },

  'about.stats': {
    label: 'À propos — chiffres-clés',
    kind: 'array' as const,
    schema: z.array(statSchema).max(8),
    default: [
      { value: '1996', sup: '', label: 'Année de création' },
      { value: '4 200', sup: '+', label: 'Diplômés' },
      { value: '86', sup: '', label: 'Intervenants experts' },
      { value: '14', sup: '', label: 'Pays africains' },
    ],
  },

  'footer.contact': {
    label: 'Pied de page — coordonnées',
    kind: 'object' as const,
    schema: z.object({
      address1: z.string().max(120),
      address2: z.string().max(120),
      phone: z.string().max(40),
      email: z.string().email().max(200),
    }),
    default: {
      address1: 'Liberté 6, Immeuble Dior',
      address2: 'Dakar — Sénégal',
      phone: '+221 33 859 73 70',
      email: 'contact@cpfa-sn.com',
    },
  },

  'footer.socials': {
    label: 'Pied de page — réseaux sociaux',
    kind: 'object' as const,
    schema: z.object({
      facebook: z.string().url().max(300).or(z.literal('')).default(''),
      linkedin: z.string().url().max(300).or(z.literal('')).default(''),
      instagram: z.string().url().max(300).or(z.literal('')).default(''),
    }),
    default: {
      facebook: '',
      linkedin: '',
      instagram: '',
    },
  },

  'site.brochureKey': {
    label: 'Brochure CPFA (PDF) — clé média',
    kind: 'object' as const,
    schema: z.object({
      key: z.string().max(400).default(''),
    }),
    default: { key: '' },
  },

  // Library official documents (Directeur §4.1) — downloadable PDFs on the
  // public bibliothèque page. Empty = the corresponding link is hidden.
  'library.documents': {
    label: 'Bibliothèque — documents officiels (PDF)',
    kind: 'object' as const,
    schema: z.object({
      regulationKey: z.string().max(400).default(''),
      procedureKey: z.string().max(400).default(''),
      subscriptionFormKey: z.string().max(400).default(''),
    }),
    default: { regulationKey: '', procedureKey: '', subscriptionFormKey: '' },
  },

  // Teacher charter (Directeur §6.1) — downloadable on /devenir-formateur.
  'teaching.charterKey': {
    label: "Enseigner au CPFA — charte de l'enseignant (PDF)",
    kind: 'object' as const,
    schema: z.object({
      key: z.string().max(400).default(''),
    }),
    default: { key: '' },
  },

  'footer.partnerLogos': {
    label: 'Pied de page — bandeau logos partenaires',
    kind: 'array' as const,
    schema: z
      .array(
        z.object({
          name: z.string().min(1).max(120),
          logoKey: z.string().max(400).optional().default(''),
          url: z.string().url().max(300).optional().or(z.literal('')).default(''),
        }),
      )
      .max(12),
    // Defaults reprenant les partenaires demandés au §1.4 + ceux déjà
    // affichés sur cpfa-sn.com — sans logoKey tant que l'éditeur n'a pas
    // uploadé les images, le composant fallback affiche le nom en serif.
    default: [
      { name: 'IIA Yaoundé', logoKey: '', url: 'https://iiayaounde.com/' },
      { name: 'DNA', logoKey: '', url: 'http://www.dna.finances.gouv.sn/' },
      { name: 'FSSA', logoKey: '', url: 'https://fssa.sn/' },
      { name: 'PF2E', logoKey: '', url: '' },
      { name: 'PNUD', logoKey: '', url: '' },
      { name: 'Cabinet CASAI', logoKey: '', url: '' },
    ],
  },
} as const;

export type SettingsRegistry = typeof settingsRegistry;
export type SettingKey = keyof SettingsRegistry;
export type SettingValue<K extends SettingKey> = z.infer<SettingsRegistry[K]['schema']>;

export const SETTING_KEYS = Object.keys(settingsRegistry) as SettingKey[];

export function isKnownKey(key: string): key is SettingKey {
  return key in settingsRegistry;
}

// Parse a raw JSON value with the per-key schema. Returns `default` if the
// row is missing or malformed (logged so an editor sees something bizarre
// rather than a 500). Never throws.
export function parseSettingValue<K extends SettingKey>(
  key: K,
  raw: unknown,
): SettingValue<K> {
  const entry = settingsRegistry[key];
  const result = entry.schema.safeParse(raw);
  if (result.success) {
    return result.data as SettingValue<K>;
  }
  console.warn(`[site-settings] invalid value for ${key} — using default. ${result.error.message}`);
  return entry.default as SettingValue<K>;
}
