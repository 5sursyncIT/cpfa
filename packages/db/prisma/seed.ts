import { randomBytes } from 'node:crypto';
import {
  CourseKind,
  CourseLevel,
  PrismaClient,
  ResourceKind,
  Role,
  SubscriptionStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

function buildQrPayload(kind: 'subscription' | 'resource', id: string, secret: string): string {
  return `cpfa:${kind}:${id}:${secret.slice(0, 12)}`;
}

async function main() {
  // ── Admin user ──────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cpfa.local' },
    update: {},
    create: {
      email: 'admin@cpfa.local',
      firstName: 'Super',
      lastName: 'Admin',
      roles: [Role.SUPER_ADMIN, Role.ADMIN],
      emailVerifiedAt: new Date(),
    },
  });

  // ── Sample subscriber (Abonné) ──────────────────────────────────────────
  const subscriber = await prisma.user.upsert({
    where: { email: 'abonne@cpfa.local' },
    update: {},
    create: {
      email: 'abonne@cpfa.local',
      firstName: 'Aïssatou',
      lastName: 'Diop',
      roles: [Role.ABONNE_BIBLIOTHEQUE, Role.CANDIDAT],
      emailVerifiedAt: new Date(),
    },
  });

  // ── Library resources ───────────────────────────────────────────────────
  const sampleResources: Array<{
    title: string;
    subtitle?: string;
    authors: string[];
    kind: ResourceKind;
    publisher?: string;
    publishedYear?: number;
    isbn?: string;
    keywords: string[];
    summary?: string;
    totalCopies?: number;
  }> = [
    {
      title: "Traité général de l'assurance",
      subtitle: 'Principes et pratique en Afrique de l’Ouest',
      authors: ['Mamadou Sow'],
      kind: ResourceKind.BOOK,
      publisher: 'Éditions CPFA',
      publishedYear: 2022,
      isbn: '9782001020304',
      keywords: ['assurance', 'CIMA', 'principes'],
      summary:
        'Ouvrage de référence couvrant les fondamentaux de l’assurance dans la zone CIMA, du contrat aux mécanismes de réassurance.',
      totalCopies: 3,
    },
    {
      title: 'Gestion des risques en entreprise',
      authors: ['Fatou Ndiaye', 'Ibrahima Fall'],
      kind: ResourceKind.BOOK,
      publisher: 'Karthala',
      publishedYear: 2020,
      isbn: '9782811126391',
      keywords: ['risk management', 'enterprise', 'erm'],
      summary: 'Méthodologies de cartographie et de traitement des risques en contexte africain.',
      totalCopies: 2,
    },
    {
      title: 'Revue Africaine d’Assurance — n°48',
      authors: ['Collectif'],
      kind: ResourceKind.JOURNAL,
      publisher: 'FANAF',
      publishedYear: 2024,
      keywords: ['revue', 'fanaf', 'cima'],
      totalCopies: 1,
    },
    {
      title: 'L’assurance vie au Sénégal',
      subtitle: 'Mémoire DTA',
      authors: ['Abdou Kane'],
      kind: ResourceKind.THESIS,
      publishedYear: 2023,
      keywords: ['vie', 'sénégal', 'mémoire'],
      summary: 'Étude sur la pénétration de l’assurance vie auprès des particuliers à Dakar.',
      totalCopies: 1,
    },
  ];

  for (const r of sampleResources) {
    await prisma.resource.upsert({
      where: { qrPayload: `cpfa:resource:${r.title}:seed` },
      update: {},
      create: {
        ...r,
        qrPayload: buildQrPayload('resource', r.title, randomBytes(8).toString('hex')),
      },
    });
  }

  // ── Active subscription for the sample subscriber ───────────────────────
  await prisma.subscription.upsert({
    where: { qrPayload: `cpfa:subscription:abonne@cpfa.local:seed` },
    update: {},
    create: {
      userId: subscriber.id,
      cardNumber: 'CPFA-SEED-0001',
      status: SubscriptionStatus.ACTIVE,
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      qrPayload: buildQrPayload('subscription', 'abonne@cpfa.local', randomBytes(8).toString('hex')),
    },
  });

  // ── Sample courses + sessions ───────────────────────────────────────────
  const dta = await prisma.course.upsert({
    where: { slug: 'dta-diplome-technicien-assurance' },
    update: {},
    create: {
      slug: 'dta-diplome-technicien-assurance',
      title: 'Diplôme de Technicien d’Assurance (DTA)',
      kind: CourseKind.DIPLOMANT,
      level: CourseLevel.INITIATION,
      durationHours: 1200,
      priceXof: 600_000,
      published: true,
      description:
        'Formation diplômante en deux ans. Couvre les fondamentaux juridiques, techniques et commerciaux de l’assurance en zone CIMA.',
      modules: {
        create: [
          {
            position: 1,
            title: 'Cadre juridique et environnement de l’assurance',
            lessons: {
              create: [
                { position: 1, title: 'Introduction au droit des assurances' },
                { position: 2, title: 'Le code CIMA' },
                { position: 3, title: 'Acteurs du marché' },
              ],
            },
          },
          {
            position: 2,
            title: 'Techniques d’assurance IARD',
            lessons: {
              create: [
                { position: 1, title: 'Assurance automobile' },
                { position: 2, title: 'Assurance habitation' },
                { position: 3, title: 'Assurance entreprise' },
              ],
            },
          },
          {
            position: 3,
            title: 'Assurance vie et capitalisation',
            lessons: {
              create: [
                { position: 1, title: 'Produits d’épargne' },
                { position: 2, title: 'Prévoyance' },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.courseSession.upsert({
    where: { id: `${dta.id}-2026-10` },
    update: {},
    create: {
      id: `${dta.id}-2026-10`,
      courseId: dta.id,
      startsAt: new Date('2026-10-05T08:00:00.000Z'),
      endsAt: new Date('2027-06-30T17:00:00.000Z'),
      location: 'CPFA Dakar — Campus principal',
      capacity: 30,
    },
  });

  await prisma.course.upsert({
    where: { slug: 'cert-souscription-iard' },
    update: {},
    create: {
      slug: 'cert-souscription-iard',
      title: 'Certification — Souscription IARD',
      kind: CourseKind.CERTIFIANT,
      level: CourseLevel.INTERMEDIAIRE,
      durationHours: 60,
      priceXof: 150_000,
      published: true,
      description:
        'Trois semaines intensives pour les souscripteurs IARD : analyse de risque, tarification, gestion des sinistres complexes.',
    },
  });

  // ── Sample seminar with speaker ─────────────────────────────────────────
  const speaker = await prisma.speaker.upsert({
    where: { id: 'speaker-seed-1' },
    update: {},
    create: {
      id: 'speaker-seed-1',
      fullName: 'Dr Awa Cissé',
      title: 'Actuaire conseil — FANAF',
      bio: 'Vingt ans d’expérience en pricing et solvabilité dans la zone CIMA.',
    },
  });

  await prisma.seminar.upsert({
    where: { slug: 'sem-tarification-vie-2026' },
    update: {},
    create: {
      slug: 'sem-tarification-vie-2026',
      title: 'Tarification de l’assurance vie en zone CIMA',
      startsAt: new Date('2026-09-15T09:00:00.000Z'),
      endsAt: new Date('2026-09-16T17:00:00.000Z'),
      location: 'CPFA Dakar — Salle Sénégal',
      priceXof: 75_000,
      capacity: 40,
      published: true,
      description:
        'Deux journées d’atelier sur les tables de mortalité, l’adéquation produits et les contraintes Solvency-CIMA.',
      speakers: { connect: [{ id: speaker.id }] },
    },
  });

  // ── A published article so /blog isn't empty ────────────────────────────
  await prisma.article.upsert({
    where: { slug: 'rentree-2026-formations' },
    update: {},
    create: {
      slug: 'rentree-2026-formations',
      title: 'Ouverture des inscriptions — rentrée 2026',
      excerpt:
        'Les inscriptions aux formations diplômantes (DTA, BTS) et certifiantes du CPFA sont ouvertes pour la session 2026-2027.',
      authorId: admin.id,
      published: true,
      publishedAt: new Date(),
      tags: ['rentrée', 'formations'],
      content: [
        { kind: 'paragraph', text: "Le CPFA accueille votre dossier de candidature dès aujourd'hui." },
        { kind: 'heading', level: 2, text: 'Formations ouvertes' },
        { kind: 'paragraph', text: 'DTA, BTS Assurance, Certifications professionnelles et séminaires courts.' },
      ],
    },
  });

  // eslint-disable-next-line no-console
  console.log('Seed complete:');
  // eslint-disable-next-line no-console
  console.log('  • admin:    admin@cpfa.local (Super-admin)');
  // eslint-disable-next-line no-console
  console.log('  • abonné:   abonne@cpfa.local (carte CPFA-SEED-0001)');
  // eslint-disable-next-line no-console
  console.log(`  • ${sampleResources.length} ressources, 1 article publié.`);
  // eslint-disable-next-line no-console
  console.log('  • 2 formations + 1 session DTA + 1 séminaire publiés.');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
