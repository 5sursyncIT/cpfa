// Défauts anglais des réglages de site.
//
// Pourquoi ce fichier existe : `settingsRegistry[key].default` est une valeur
// unique, en français. Tant que l'administration n'a pas saisi de ligne `en`,
// c'est ce défaut qui s'affiche — un visiteur anglophone lisait donc un site
// entièrement français, y compris sur une installation neuve où AUCUNE ligne
// n'existe. Le catalogue de messages next-intl ne pouvait rien y faire : ce
// contenu-là est éditorial, pas de l'habillage d'interface.
//
// Ne sont repris ici que les réglages porteurs de texte. Ceux qui ne
// contiennent que des données — clés média, URL, montants, coordonnées
// techniques, identifiants de contrat — n'ont pas de version anglaise : leur
// défaut français fait déjà l'affaire dans les deux langues.
//
// `site.maintenance` est volontairement absent : la page d'attente lit
// toujours la ligne `fr` (c'est un drapeau global, cf. `maintenance/guard.ts`),
// donc un défaut `en` ne serait jamais atteint.
//
// L'ordre de résolution ne change pas — ligne (clé, locale) → ligne FR →
// défaut de la locale. Une valeur saisie par l'administration en français
// continue donc de primer sur ces défauts : c'est voulu, sinon une image de
// bandeau ou un montant corrigé côté FR disparaîtrait de la version anglaise.
// Pour traduire ces textes-là, l'onglet EN de /admin/settings est fait pour ça.

import { defaultLocale, type Locale } from '@/i18n/locales';
import { settingsRegistry, type SettingKey, type SettingValue } from './registry';

type LocalizedDefaults = { [K in SettingKey]?: SettingValue<K> };

// Le type ci-dessus contraint chaque entrée au schéma zod de sa clé : une
// traduction qui oublie un champ ou en invente un ne compile pas.
const EN: LocalizedDefaults = {
  'home.hero': {
    eyebrow: 'A decentralised unit of IIA Yaoundé',
    headline:
      'Senegal’s *leading centre* for professional training in the insurance industry.',
    description:
      'Recognised by the Direction des Assurances. Degrees (DTA, BTS), specialist certifications, seminars and a dedicated library — serving professionals and students across the CIMA zone.',
    backgroundImageKey: '',
  },

  'home.marquee': [
    'Course catalogue · {formations}',
    'Library · {ouvrages} titles',
    'Scheduled seminars · {seminaires}',
    'A decentralised unit of IIA Yaoundé',
    'Recognised by the Direction des Assurances',
  ],

  'home.featured': {
    eyebrow: 'Flagship programmes',
    headline: '{formations} programmes, *as many career paths*\nin insurance.',
    cta: 'See the full catalogue',
    emptyTitle: 'The catalogue is being prepared',
    emptyDescription:
      'No course has been published yet. Do check back shortly — the next intake opens in a matter of days.',
    emptyAction: 'Notify me at launch',
  },

  'home.books': {
    eyebrow: 'Specialist library',
    headline: '{ouvrages} books, dissertations and\nstudies — *subscriber access*.',
    cta: 'Explore the collection',
    emptyTitle: 'The collection is taking shape',
    emptyDescription:
      'The first titles are being catalogued. The library opens for consultation as soon as subscriptions do.',
    emptyAction: 'See access conditions',
  },

  'home.concours': {
    eyebrow: 'Entrance examination',
    headline: 'Applications *close in*',
    ctaPrimary: 'Prepare my application',
    ctaSecondary: 'Download past papers',
    fallbackDescription:
      'The entrance examination is open to holders of a CAMES-recognised degree. Four papers: economic and financial literacy, financial mathematics, business English, and a motivation interview.',
    labelDeposit: 'Online submission',
    labelWritten: 'Written papers',
    labelFee: 'Application fee',
    emptyMessage:
      'No examination is open at the moment. The next session will be announced here.',
  },

  'home.blocks': {
    aboutEyebrow: 'About us',
    aboutTitle: 'CPFA, *a regional benchmark*.',
    aboutText:
      'A decentralised unit of IIA Yaoundé, recognised by the Direction des Assurances. Discover our mission, our governance and our partners.',
    aboutBrochureCta: 'CPFA brochure',
    aboutDirectorCta: 'Director’s message',
    formationEyebrow: 'Training',
    formationTitle: 'Three routes, *one standard*.',
    formationColCertifications: 'Short, certified specialisations.',
    formationColDiplomas: 'Recognised degree programmes.',
    formationColSeminars: 'Short sessions & entrance examinations.',
    upcomingEyebrow: 'Coming up',
    upcomingTitle: 'Upcoming *dates*.',
    upcomingEmpty: 'No session or examination scheduled at the moment.',
    libraryEyebrow: 'Library',
    libraryTitle: 'Discover the *library*.',
    libraryText:
      '{ouvrages} titles on insurance, actuarial science, transport and risk. Three subscription plans (student {tarifEtudiant} · professional {tarifPro} · home loans {tarifEmprunt} per year), a PDF subscriber card and a downloadable agreement.',
    libraryCatalogCta: 'Explore the catalogue',
    librarySubscribeCta: 'Subscribe',
  },

  'home.testimonialsSection': {
    eyebrow: 'Alumni voices',
    headline: 'They studied at CPFA\n*— and proved it.*',
    emptyTitle: 'The first accounts are on their way',
    emptyDescription:
      'Graduates of the 2026 cohort will share their journeys as soon as they complete the programme.',
  },

  // Témoignages d'exemple, affichés tant qu'aucun n'est publié dans
  // /admin/testimonials. Les noms restent tels quels — seules les citations et
  // les fonctions se traduisent.
  'home.testimonials': [
    {
      quote:
        'CPFA opened the doors to the technical department of a major pan-African insurer. The case studies were formidably true to life.',
      name: 'Aïssatou Ndiaye',
      role: 'Technical Director · NSIA Assurances',
    },
    {
      quote:
        'What I valued was the academic rigour combined with a genuine reading of the West African context. That is rare.',
      name: 'Cheikh A. Bâ',
      role: 'Inspector · Direction des Assurances',
    },
    {
      quote:
        'The library alone justifies enrolling. No other specialist collection in the sub-region comes close.',
      name: 'Marie-Louise Sagna',
      role: 'PhD candidate · UCAD',
    },
  ],

  'home.stats': [
    { value: '30', sup: 'yrs', label: 'Serving the industry' },
    { value: '4,200', sup: '+', label: 'Active graduates' },
    { value: '14', sup: '', label: 'African countries represented' },
    { value: '96', sup: '%', label: '12-month employment rate' },
  ],

  'about.stats': [
    { value: '1996', sup: '', label: 'Year founded' },
    { value: '4,200', sup: '+', label: 'Graduates' },
    { value: '86', sup: '', label: 'Expert lecturers' },
    { value: '14', sup: '', label: 'African countries' },
  ],

  'about.governance': [
    {
      role: 'Executive management',
      name: 'El Hadji Cheikhou Oumar SECK',
      note: 'Director — CPFA',
    },
  ],

  'footer.contact': {
    address1: 'Liberté 6, Immeuble Dior',
    address2: 'Dakar — Senegal',
    phone: '+221 33 859 73 70',
    email: 'contact@cpfa-sn.com',
  },

  'payments.mobileMoney': {
    waveQrKey: '',
    waveNumber: '',
    orangeQrKey: '',
    orangeNumber: '',
    instructions:
      'Once you have paid, enter the transaction reference below: our accounts team verifies it and activates your subscription.',
    accountingEmail: 'contact@cpfa-sn.com',
  },
};

const LOCALIZED: Partial<Record<Locale, LocalizedDefaults>> = { en: EN };

/**
 * Défaut d'un réglage dans la langue demandée, avec repli sur le français.
 *
 * À utiliser partout où l'on écrivait `settingsRegistry[key].default` : c'est
 * le dernier maillon de la chaîne de résolution, celui qui s'applique tant
 * qu'aucune ligne n'existe en base — c'est-à-dire, sur une installation
 * neuve, à peu près partout.
 */
export function settingDefault<K extends SettingKey>(
  key: K,
  locale: Locale = defaultLocale,
): SettingValue<K> {
  const localized = LOCALIZED[locale]?.[key];
  if (localized !== undefined) return localized;
  return settingsRegistry[key].default as SettingValue<K>;
}

/** Vrai si la clé dispose d'une traduction pour cette langue. */
export function hasLocalizedDefault(key: SettingKey, locale: Locale): boolean {
  return LOCALIZED[locale]?.[key] !== undefined;
}
