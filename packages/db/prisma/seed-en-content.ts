// Crée la version anglaise des contenus éditoriaux stockés en table :
// chiffres-clés, gouvernance, partenaires.
//
// Pourquoi un script plutôt qu'un défaut dans le code : ces trois tables sont
// alimentées par l'administration depuis le back-office. Leur lecture
// (`lib/content-blocks.ts`) essaie la locale demandée, puis retombe sur les
// lignes FR, et n'atteint le défaut du registre que si les DEUX sont vides.
// Autrement dit, dès qu'une ligne FR existe — c'est le cas en production — un
// visiteur anglophone voit le texte français, quoi qu'on mette dans le code.
// Il faut donc de vraies lignes `en`.
//
// Le script est idempotent : il ne touche pas à une table qui a déjà des
// lignes `en`, et il ne modifie jamais les lignes `fr`. On peut le relancer
// sans risque. Les traductions inconnues sont recopiées telles quelles et
// signalées en sortie, pour que l'administration sache ce qui reste à
// reprendre depuis l'onglet EN du back-office.
//
//   pnpm --filter @cpfa/db seed:en
//
// En production, contre la base du conteneur :
//   DATABASE_URL=... pnpm --filter @cpfa/db seed:en

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SOURCE = 'fr';
const TARGET = 'en';

// Libellés connus, tels qu'ils ont été saisis côté français. Tout ce qui n'est
// pas dans cette table est recopié à l'identique puis signalé.
const LABELS: Record<string, string> = {
  // Chiffres-clés — page d'accueil
  'Au service du secteur': 'Serving the industry',
  'Diplômés actifs': 'Active graduates',
  "Pays d'Afrique représentés": 'African countries represented',
  "Taux d'insertion 12 mois": '12-month employment rate',
  // Chiffres-clés — page « À propos »
  'Année de création': 'Year founded',
  Diplômés: 'Graduates',
  'Intervenants experts': 'Expert lecturers',
  'Pays africains': 'African countries',
  // Gouvernance
  'Direction générale': 'Executive management',
  'Directeur — CPFA': 'Director — CPFA',
};

// Exposants : « ans » est le seul à porter du texte.
const SUPS: Record<string, string> = { ans: 'yrs' };

// Les nombres se regroupent différemment : 4 200 (fr) → 4,200 (en).
function localiseNumber(value: string): string {
  return /^\d[\d\s  ]*$/.test(value)
    ? value.replace(/[\s  ]/g, ',')
    : value;
}

const untranslated = new Set<string>();

function translate(text: string | null | undefined): string {
  if (!text) return text ?? '';
  const hit = LABELS[text];
  if (hit) return hit;
  untranslated.add(text);
  return text;
}

async function main() {
  // ── Chiffres-clés ─────────────────────────────────────────────────────
  const figuresExisting = await prisma.keyFigure.count({ where: { locale: TARGET } });
  if (figuresExisting > 0) {
    console.log(`KeyFigure  : ${figuresExisting} ligne(s) ${TARGET} déjà présentes — ignoré.`);
  } else {
    const rows = await prisma.keyFigure.findMany({ where: { locale: SOURCE } });
    if (rows.length === 0) {
      console.log('KeyFigure  : aucune ligne source — ignoré.');
    } else {
      await prisma.keyFigure.createMany({
        data: rows.map((r) => ({
          section: r.section,
          locale: TARGET,
          value: localiseNumber(r.value),
          sup: SUPS[r.sup] ?? r.sup,
          label: translate(r.label),
          displayOrder: r.displayOrder,
        })),
      });
      console.log(`KeyFigure  : ${rows.length} ligne(s) ${TARGET} créées.`);
    }
  }

  // ── Gouvernance ───────────────────────────────────────────────────────
  const govExisting = await prisma.governanceMember.count({ where: { locale: TARGET } });
  if (govExisting > 0) {
    console.log(`Governance : ${govExisting} ligne(s) ${TARGET} déjà présentes — ignoré.`);
  } else {
    const rows = await prisma.governanceMember.findMany({ where: { locale: SOURCE } });
    if (rows.length === 0) {
      console.log('Governance : aucune ligne source — ignoré.');
    } else {
      await prisma.governanceMember.createMany({
        data: rows.map((r) => ({
          locale: TARGET,
          // Le nom d'une personne ne se traduit pas — seuls la fonction et la
          // mention sous le nom changent de langue.
          role: translate(r.role),
          name: r.name,
          note: r.note ? translate(r.note) : r.note,
          displayOrder: r.displayOrder,
        })),
      });
      console.log(`Governance : ${rows.length} ligne(s) ${TARGET} créées.`);
    }
  }

  // ── Partenaires ───────────────────────────────────────────────────────
  // Recopiés à l'identique : ce sont des noms propres d'institutions. On crée
  // quand même les lignes `en` pour que le back-office puisse les réordonner
  // ou en masquer indépendamment du français.
  const partnersExisting = await prisma.partner.count({ where: { locale: TARGET } });
  if (partnersExisting > 0) {
    console.log(`Partners   : ${partnersExisting} ligne(s) ${TARGET} déjà présentes — ignoré.`);
  } else {
    const rows = await prisma.partner.findMany({ where: { locale: SOURCE } });
    if (rows.length === 0) {
      console.log('Partners   : aucune ligne source — ignoré.');
    } else {
      await prisma.partner.createMany({
        data: rows.map((r) => ({
          locale: TARGET,
          name: r.name,
          logoKey: r.logoKey,
          url: r.url,
          displayOrder: r.displayOrder,
        })),
      });
      console.log(`Partners   : ${rows.length} ligne(s) ${TARGET} créées.`);
    }
  }

  if (untranslated.size > 0) {
    console.log('\nRecopiés en français faute de traduction connue —');
    console.log('à reprendre depuis l’onglet EN du back-office :');
    for (const text of untranslated) console.log(`  · ${text}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
