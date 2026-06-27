// Importe le catalogue documentaire du CPFA (catalogues_ressources_documentaires).
//
// Source : docs/catalogue-source.md (extraction Markdown du PDF, OCR bruité).
// Stratégie :
//   - 26 catégories documentaires créées proprement (table des classes).
//   - Chaque entrée est repérée par sa COTE (ex. "OUG 9.1", "REA 13.1") ; le
//     préfixe de cote détermine la catégorie de façon fiable, indépendamment
//     de la mise en page de la ligne.
//   - Titre extrait entre « » ou " ", auteur = cellule de la cote nettoyée,
//     mots-clés = cellule contenant des « / ».
//   - Idempotent (upsert par qrPayload dérivé de la cote / du titre).
//
// Le PDF prévient que certaines lignes (cellules fusionnées) nécessitent une
// vérification manuelle — le script journalise le nombre d'entrées et les
// lignes ignorées.
//
// Lancement : pnpm --filter @cpfa/db seed:catalogue

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── 26 classes documentaires (table des classes du catalogue) ──────────────
const CATEGORIES: Array<{ n: number; name: string }> = [
  { n: 1, name: 'Ouvrages généraux et usuels' },
  { n: 2, name: 'Assurances risques techniques' },
  { n: 3, name: 'Audit - Contrôle - Gestion' },
  { n: 4, name: 'Informatique - Digital' },
  { n: 5, name: 'Gestion des connaissances' },
  { n: 6, name: 'Assurance islamique' },
  { n: 7, name: 'Micro-assurance' },
  { n: 8, name: 'Réassurance' },
  { n: 9, name: 'Assurance-crédit' },
  { n: 10, name: 'Assurance responsabilité civile' },
  { n: 11, name: 'Généralités et bases techniques' },
  { n: 12, name: 'Risk management - Ingénierie des risques' },
  { n: 13, name: 'Assurance État - Collectivités locales' },
  { n: 14, name: 'Assurance construction' },
  { n: 15, name: 'Assurance incendie' },
  { n: 16, name: 'Assurance santé - vie - personnes' },
  { n: 17, name: 'Courtage' },
  { n: 18, name: 'Société - Économie - Environnement' },
  { n: 19, name: 'Assistance' },
  { n: 20, name: 'Assurance automobile' },
  { n: 21, name: 'Assurance transport' },
  { n: 22, name: 'Actuariat et études statistiques' },
  { n: 23, name: 'Comptabilité en assurance' },
  { n: 24, name: 'Législation en assurance' },
  { n: 25, name: 'Assurance risques divers' },
  { n: 26, name: 'Séminaires' },
];

// Préfixe de cote → numéro de classe.
const PREFIX_TO_CLASS: Record<string, number> = {
  OUG: 1,
  ART: 2,
  GEF: 3,
  INF: 4,
  GEC: 5,
  AIS: 6,
  MIC: 7,
  REA: 8,
  EA: 8, // coquille OCR fréquente pour REA
  ACR: 9,
  ARC: 10,
  GBA: 11,
  MAS: 12,
  AEC: 13,
  ASC: 14,
  ASI: 15,
  ASP: 16,
  CRT: 17,
  SEC: 18,
  ASS: 19,
  ASA: 20,
  AST: 21,
  ACT: 22,
  CAS: 23,
  LEG: 24,
  ARD: 25,
  SEM: 26,
};

const PREFIXES = Object.keys(PREFIX_TO_CLASS).sort((a, b) => b.length - a.length);
const COTE_RE = new RegExp(
  `\\b(${PREFIXES.join('|')})\\s*[:.]?\\s*(\\d{1,3})\\.?\\s?(\\d{0,3})`,
);

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// Répare le mojibake (UTF-8 lu comme Windows-1252) si la source en contient.
// Sur une source déjà propre (UTF-8 correct), no-op.
function fixText(s: string): string {
  if (!/[ÃÂ]|â€/.test(s)) return s;
  const pre = s
    .replace(/â€™/g, "'") // ’
    .replace(/â€˜/g, "'") // ‘
    .replace(/â€œ/g, '"') // “
    .replace(/â€(|”)/g, '"') // ”
    .replace(/â€“/g, '-') // –
    .replace(/â€”/g, '-') // —
    .replace(/Å“/g, 'oe'); // œ
  let out: string;
  try {
    out = Buffer.from(pre, 'binary').toString('utf8');
  } catch {
    out = pre;
  }
  return out.replace(/�/g, '').replace(/ /g, ' ');
}

type Parsed = {
  title: string;
  authors: string[];
  cote: string | null;
  keywords: string[];
  classN: number | null;
};

function parseRow(rawLine: string): Parsed | null {
  const line = fixText(rawLine).replace(/<br\s*\/?>/gi, ' ');
  // Cellules du tableau Markdown.
  const cells = line
    .split('|')
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
  if (cells.length === 0) return null;
  if (cells.every((c) => /^-+$/.test(c))) return null; // séparateur
  const joined = cells.join(' ');

  // Titre : entre « » ou guillemets droits.
  const titleMatch =
    joined.match(/[«"]\s*([^«»"]{3,400}?)\s*[»"]/) ?? joined.match(/[«"]\s*([^«»"]{3,400})/);
  if (!titleMatch) return null;
  let title = titleMatch[1]!.trim().replace(/\s+/g, ' ');
  // Retire un éventuel numéro d'ordre résiduel en tête.
  title = title.replace(/^\d+\s*[/.-]\s*/, '').trim();
  if (title.length < 3) return null;

  // Cote.
  const coteMatch = joined.match(COTE_RE);
  let cote: string | null = null;
  let classN: number | null = null;
  if (coteMatch) {
    const prefix = coteMatch[1]!.toUpperCase();
    const num = coteMatch[3] ? `${coteMatch[2]}.${coteMatch[3]}` : coteMatch[2]!;
    cote = `${prefix} ${num}`;
    classN = PREFIX_TO_CLASS[prefix] ?? null;
  }

  // Auteur : cellule contenant la cote, débarrassée de la cote + libellé COTE.
  let authors: string[] = [];
  if (coteMatch) {
    const coteCell = cells.find((c) => COTE_RE.test(c)) ?? '';
    const cleaned = coteCell
      .replace(/COTE\s*[:.]?/gi, '')
      .replace(COTE_RE, '')
      .replace(/\([^)]*exemplaires?[^)]*\)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    authors = cleaned
      .split(/\s*[/]\s*/)
      .map((a) => a.replace(/^[\s—–-]+|[\s—–-]+$/g, '').trim())
      .filter((a) => a.length > 1 && !/^\d+$/.test(a));
  }

  // Mots-clés : cellule avec des « / » qui n'est ni le titre ni la cote.
  let keywords: string[] = [];
  const kwCell = cells.find(
    (c) =>
      c.includes('/') &&
      !c.includes('«') &&
      !c.includes('"') &&
      !COTE_RE.test(c) &&
      !/COTE/i.test(c),
  );
  if (kwCell) {
    keywords = kwCell
      .split(/\s*[/]\s*/)
      .map((k) => k.trim())
      .filter((k) => k.length > 1 && k.length < 80);
  }

  return { title, authors, cote, keywords, classN };
}

async function main() {
  // 1) Catégories.
  const catIdByN = new Map<number, string>();
  for (const c of CATEGORIES) {
    const slug = slugify(c.name);
    const row = await prisma.category.upsert({
      where: { slug },
      update: { name: c.name },
      create: { slug, name: c.name },
    });
    catIdByN.set(c.n, row.id);
  }
  console.log(`[catalogue] ${CATEGORIES.length} catégories prêtes.`);

  // 2) Lecture de la source.
  const path = join(__dirname, '..', '..', '..', 'docs', 'catalogue-source.md');
  let md: string;
  try {
    md = readFileSync(path, 'utf8');
  } catch {
    console.error(`[catalogue] Source introuvable : ${path}`);
    console.error('Place le markdown du catalogue à cet emplacement puis relance.');
    return;
  }

  // 3) Parsing ligne à ligne (uniquement les lignes de tableau).
  const seen = new Set<string>();
  let imported = 0;
  let skipped = 0;
  const noCote: string[] = [];

  for (const rawLine of md.split('\n')) {
    if (!rawLine.trimStart().startsWith('|')) continue;
    // En-têtes de tableau.
    if (/Titres|Auteurs|Mots\s*cl|Colonne\s*\d|Classes|Th[èe]mes|Animateurs|Pages/i.test(rawLine))
      continue;
    const p = parseRow(rawLine);
    if (!p) continue;

    const dedupeKey = p.cote ? `cote:${p.cote}` : `title:${slugify(p.title)}`;
    if (seen.has(dedupeKey)) {
      skipped++;
      continue;
    }
    seen.add(dedupeKey);

    if (!p.cote) noCote.push(p.title);

    const qrSeed = p.cote ?? p.title;
    const qrPayload = `cpfa:resource:cat:${createHash('sha1').update(qrSeed).digest('hex').slice(0, 16)}`;
    const categoryId = p.classN ? (catIdByN.get(p.classN) ?? null) : null;

    await prisma.resource.upsert({
      where: { qrPayload },
      update: {
        title: p.title,
        authors: p.authors,
        cote: p.cote,
        keywords: p.keywords,
        categoryId,
      },
      create: {
        kind: 'BOOK',
        title: p.title,
        authors: p.authors,
        cote: p.cote,
        keywords: p.keywords,
        categoryId,
        totalCopies: 1,
        qrPayload,
      },
    });
    imported++;
  }

  console.log(`[catalogue] ${imported} ressources importées (${skipped} doublons ignorés).`);
  console.log(`[catalogue] ${noCote.length} entrées sans cote (catégorie non assignée).`);
  if (noCote.length > 0) {
    console.log('[catalogue] À vérifier manuellement (sans cote) :');
    for (const t of noCote.slice(0, 30)) console.log(`   - ${t}`);
    if (noCote.length > 30) console.log(`   … et ${noCote.length - 30} autres.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
