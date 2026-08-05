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
import { DEFAULT_LIBRARY_PRICING } from '../library-rules';

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
    // Accroche demandée au §1.2 par le Directeur, mot pour mot. `headline`
    // passe par renderEmph : `*…*` rend l'italique de marque.
    default: {
      eyebrow: 'Unité décentralisée de l’IIA Yaoundé',
      headline:
        'Premier centre *de référence* au Sénégal en matière de formation dans les métiers de l’assurance.',
      description:
        'Reconnu par la Direction des Assurances. Diplômes (DTA, BTS), certifications spécialisées, séminaires et bibliothèque dédiée — au service des professionnels et des étudiants de la zone CIMA.',
      backgroundImageKey: '',
    },
  },

  // Photos de fond des trois colonnes du bloc « Formation » (§1.3 b). Vide =
  // la colonne garde son fond uni, donc la page reste correcte tant que
  // l'éditeur n'a pas téléversé les visuels.
  'home.formationColumns': {
    label: 'Page d’accueil — visuels des colonnes Formation',
    kind: 'object' as const,
    schema: z.object({
      certificationsImageKey: z.string().max(400).default(''),
      diplomasImageKey: z.string().max(400).default(''),
      seminarsImageKey: z.string().max(400).default(''),
    }),
    default: {
      certificationsImageKey: '',
      diplomasImageKey: '',
      seminarsImageKey: '',
    },
  },

  'home.marquee': {
    label: 'Page d’accueil — bandeau défilant',
    kind: 'array' as const,
    schema: z.array(z.string().trim().min(1).max(160)).max(20),
    // Les jetons ({ouvrages}, {formations}, …) sont remplacés par les chiffres
    // réels au rendu — un bandeau ne doit pas annoncer un catalogue imaginaire.
    default: [
      'Catalogue de formations · {formations}',
      'Bibliothèque · {ouvrages} références',
      'Séminaires programmés · {seminaires}',
      'Unité décentralisée de l’IIA Yaoundé',
      'Reconnu par la Direction des Assurances',
    ],
  },

  // Sections « Programmes phares » et « Bibliothèque » de la page d'accueil.
  // Les titres acceptent les jetons {formations} et {ouvrages} : le nombre
  // affiché est alors celui du catalogue, jamais une valeur recopiée.
  'home.featured': {
    label: 'Page d’accueil — section Programmes',
    kind: 'object' as const,
    schema: z.object({
      eyebrow: z.string().max(120),
      headline: z.string().max(300),
      cta: z.string().max(80),
      emptyTitle: z.string().max(160),
      emptyDescription: z.string().max(600),
      emptyAction: z.string().max(80),
    }),
    default: {
      eyebrow: 'Programmes phares',
      headline: '{formations} cursus pour *autant de trajectoires*\nde carrière dans l’assurance.',
      cta: 'Voir le catalogue complet',
      emptyTitle: 'Le catalogue se prépare',
      emptyDescription:
        'Aucune formation n’est encore publiée. Revenez très bientôt — la prochaine session ouvre dans quelques jours.',
      emptyAction: 'Être informé du lancement',
    },
  },

  'home.books': {
    label: 'Page d’accueil — section Bibliothèque',
    kind: 'object' as const,
    schema: z.object({
      eyebrow: z.string().max(120),
      headline: z.string().max(300),
      cta: z.string().max(80),
      emptyTitle: z.string().max(160),
      emptyDescription: z.string().max(600),
      emptyAction: z.string().max(80),
    }),
    default: {
      eyebrow: 'Bibliothèque spécialisée',
      headline: '{ouvrages} ouvrages, mémoires et\nétudes — *accès aux abonnés*.',
      cta: 'Explorer le fonds',
      emptyTitle: 'Le fonds se constitue',
      emptyDescription:
        'Les premières références arrivent au catalogue. La bibliothèque sera consultable dès l’ouverture des abonnements.',
      emptyAction: 'Voir les conditions d’accès',
    },
  },

  // Bloc concours. Les dates et le montant viennent du concours publié en base
  // — ici on ne règle que les libellés et les appels à l'action.
  'home.concours': {
    label: 'Page d’accueil — bloc Concours',
    kind: 'object' as const,
    schema: z.object({
      eyebrow: z.string().max(120),
      headline: z.string().max(200),
      ctaPrimary: z.string().max(80),
      ctaSecondary: z.string().max(80),
      fallbackDescription: z.string().max(800),
      labelDeposit: z.string().max(80),
      labelWritten: z.string().max(80),
      labelFee: z.string().max(80),
      emptyMessage: z.string().max(300),
    }),
    default: {
      eyebrow: 'Concours d’entrée',
      headline: 'Le concours *ferme dans*',
      ctaPrimary: 'Préparer mon dossier',
      ctaSecondary: 'Télécharger les annales',
      fallbackDescription:
        'Le concours d’entrée est ouvert aux titulaires d’un diplôme reconnu par le CAMES. Quatre épreuves : culture économique, mathématiques financières, anglais des affaires et entretien de motivation.',
      labelDeposit: 'Dépôt en ligne',
      labelWritten: 'Épreuves écrites',
      labelFee: 'Frais de dossier',
      emptyMessage:
        'Aucun concours n’est ouvert actuellement. La prochaine session sera annoncée ici.',
    },
  },

  // Les quatre encarts sous le bandeau. Jetons acceptés : {ouvrages},
  // {formations}, {seminaires}, {concours}, {abonnes} et, pour la bibliothèque,
  // {tarifEtudiant}, {tarifPro}, {tarifEmprunt}.
  'home.blocks': {
    label: 'Page d’accueil — les quatre encarts',
    kind: 'object' as const,
    schema: z.object({
      aboutEyebrow: z.string().max(80),
      aboutTitle: z.string().max(200),
      aboutText: z.string().max(600),
      aboutBrochureCta: z.string().max(80),
      aboutDirectorCta: z.string().max(80),
      formationEyebrow: z.string().max(80),
      formationTitle: z.string().max(200),
      formationColCertifications: z.string().max(120),
      formationColDiplomas: z.string().max(120),
      formationColSeminars: z.string().max(120),
      upcomingEyebrow: z.string().max(80),
      upcomingTitle: z.string().max(200),
      upcomingEmpty: z.string().max(300),
      libraryEyebrow: z.string().max(80),
      libraryTitle: z.string().max(200),
      libraryText: z.string().max(600),
      libraryCatalogCta: z.string().max(80),
      librarySubscribeCta: z.string().max(80),
    }),
    default: {
      aboutEyebrow: 'Qui sommes-nous',
      aboutTitle: 'Le CPFA, *une référence* régionale.',
      aboutText:
        'Unité décentralisée de l’IIA Yaoundé, reconnue par la Direction des Assurances. Découvrez notre mission, notre gouvernance et nos partenaires.',
      aboutBrochureCta: 'Brochure CPFA',
      aboutDirectorCta: 'Mot du Directeur',
      formationEyebrow: 'Formation',
      formationTitle: 'Trois voies, *une exigence*.',
      formationColCertifications: 'Spécialisations courtes, certifiantes.',
      formationColDiplomas: 'Cursus diplômants reconnus.',
      formationColSeminars: 'Sessions courtes & concours d’entrée.',
      upcomingEyebrow: 'À venir',
      upcomingTitle: 'Prochaines *échéances*.',
      upcomingEmpty: 'Aucune session ou concours programmé pour le moment.',
      libraryEyebrow: 'Bibliothèque',
      libraryTitle: 'Découvrez la *bibliothèque*.',
      libraryText:
        '{ouvrages} références en assurance, actuariat, transport et risques. Trois formules d’abonnement (étudiant {tarifEtudiant} · pro {tarifPro} · emprunt à domicile {tarifEmprunt} par an), carte d’abonné PDF et contrat téléchargeable.',
      libraryCatalogCta: 'Explorer le catalogue',
      librarySubscribeCta: 'S’abonner',
    },
  },

  // Habillage de la section « Voix d'alumni » : sur-titre, titre et message
  // affiché tant qu'aucun témoignage n'est publié. Les témoignages eux-mêmes se
  // gèrent dans /admin/testimonials — ici on ne touche qu'au texte autour.
  'home.testimonialsSection': {
    label: 'Page d’accueil — section témoignages',
    kind: 'object' as const,
    schema: z.object({
      eyebrow: z.string().max(120),
      headline: z.string().max(300),
      emptyTitle: z.string().max(160),
      emptyDescription: z.string().max(600),
    }),
    // `headline` passe par renderEmph : `*…*` rend l'italique de marque, un
    // retour à la ligne reste un retour à la ligne.
    default: {
      eyebrow: 'Voix d’alumni',
      headline: 'Ils ont étudié au CPFA\n*— et l’ont prouvé.*',
      emptyTitle: 'Les premiers retours arrivent',
      emptyDescription:
        'Les diplômés de la promotion 2026 partageront leurs parcours dès la fin du cursus.',
    },
  },

  'home.testimonials': {
    label: 'Page d’accueil — témoignages (exemples affichés tant qu’aucun n’est publié)',
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

  // Grille tarifaire de la bibliothèque. Ces quatre montants pilotent tout :
  // ce que la caisse encaisse, les trois formules affichées, la procédure
  // publiée et l'article 4 du contrat d'abonnement. Le total de la formule
  // emprunt à domicile est calculé (droit + caution), jamais saisi.
  'library.pricing': {
    label: 'Bibliothèque — tarifs d’abonnement',
    kind: 'object' as const,
    schema: z.object({
      studentXof: z.coerce.number().int().min(0).max(10_000_000),
      professionalXof: z.coerce.number().int().min(0).max(10_000_000),
      homeLoanFeeXof: z.coerce.number().int().min(0).max(10_000_000),
      homeLoanDepositXof: z.coerce.number().int().min(0).max(10_000_000),
    }),
    default: DEFAULT_LIBRARY_PRICING,
  },

  // Paiement mobile — en attendant l'activation de PayTech, l'abonné paie en
  // scannant le QR marchand du CPFA puis déclare sa référence de transaction ;
  // la comptabilité vérifie et confirme. Les images sont choisies dans la
  // médiathèque, comme une photo. Un canal sans QR ni numéro n'est simplement
  // pas proposé.
  'payments.mobileMoney': {
    label: 'Paiement mobile — QR Wave et Orange Money',
    kind: 'object' as const,
    schema: z.object({
      waveQrKey: z.string().max(400).default(''),
      waveNumber: z.string().max(40).default(''),
      orangeQrKey: z.string().max(400).default(''),
      orangeNumber: z.string().max(40).default(''),
      instructions: z.string().max(600).default(''),
      accountingEmail: z.string().email().max(200).or(z.literal('')).default(''),
    }),
    default: {
      waveQrKey: '',
      waveNumber: '',
      orangeQrKey: '',
      orangeNumber: '',
      instructions:
        'Après le paiement, indiquez ci-dessous la référence de la transaction : la comptabilité vérifie et active votre abonnement.',
      accountingEmail: 'contact@cpfa-sn.com',
    },
  },

  // Mentions du contrat d'abonnement à la bibliothèque. Elles figurent en
  // en-tête du PDF généré à l'activation de chaque abonnement : si la gérante
  // change ou si la bibliothèque déménage, cela se corrige ici, sans toucher
  // au code.
  'library.contract': {
    label: "Bibliothèque — mentions du contrat d'abonnement",
    kind: 'object' as const,
    schema: z.object({
      libraryAddress: z.string().max(300),
      managerName: z.string().max(120),
      city: z.string().max(80),
    }),
    default: {
      libraryAddress:
        'Liberté 6 Ext Lot 242 — Immeuble Serigne Cheikh Mbacké Gaïndé Fatma, 5ème étage',
      managerName: 'Madame Marie José PREIRA',
      city: 'Dakar',
    },
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

  // Maintenance gate. Operational switch rather than editorial content, so it
  // is deliberately absent from `settingsUi` (the generic /admin/settings form)
  // and edited from its own screen, /admin/maintenance: the toggle is global
  // (always read on the `fr` row, never per-locale) and the shared preview
  // password needs special handling — stored argon2-hashed, never echoed back.
  'site.maintenance': {
    label: 'Mode maintenance',
    kind: 'object' as const,
    schema: z.object({
      enabled: z.boolean().default(false),
      title: z.string().max(160).default('Site en cours de maintenance'),
      message: z.string().max(2000).default(''),
      reopensAt: z.string().max(160).default(''),
      contactEmail: z.string().max(200).default(''),
      previewPasswordHash: z.string().max(300).default(''),
    }),
    default: {
      enabled: false,
      title: 'Site en cours de maintenance',
      message:
        "Le site du CPFA est momentanément indisponible, le temps d'une mise à jour. Merci de votre patience — nous revenons très vite.",
      reopensAt: '',
      contactEmail: 'contact@cpfa-sn.com',
      previewPasswordHash: '',
    },
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

// Parse a raw JSON value with the per-key schema. Returns `fallback` if the
// row is missing or malformed (logged so an editor sees something bizarre
// rather than a 500). Never throws.
//
// `fallback` est passé par l'appelant plutôt que lu ici, pour que la valeur de
// repli suive la langue du visiteur — voir `settingDefault` dans ./defaults.
// Le défaut français reste la valeur par défaut du paramètre, ce qui garde les
// appels historiques intacts.
export function parseSettingValue<K extends SettingKey>(
  key: K,
  raw: unknown,
  fallback: SettingValue<K> = settingsRegistry[key].default as SettingValue<K>,
): SettingValue<K> {
  const entry = settingsRegistry[key];
  const result = entry.schema.safeParse(raw);
  if (result.success) {
    return result.data as SettingValue<K>;
  }
  console.warn(`[site-settings] invalid value for ${key} — using default. ${result.error.message}`);
  return fallback;
}
