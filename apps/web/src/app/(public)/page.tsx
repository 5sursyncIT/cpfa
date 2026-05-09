import Link from 'next/link';
import { prisma } from '@cpfa/db';
import { Book } from '@/components/cpfa/book';
import { Countdown } from '@/components/cpfa/countdown';
import { FormationCard } from '@/components/cpfa/formation-card';
import { Marquee } from '@/components/cpfa/marquee';
import { OrbitGraphic } from '@/components/cpfa/logo-mark';
import { courseToCard, resourceToBook } from '@/lib/cpfa-mappers';

export const dynamic = 'force-dynamic';

const TESTIMONIALS = [
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
];

const HOME_STATS = [
  { value: '30', sup: 'ans', label: 'Au service du secteur' },
  { value: '4 200', sup: '+', label: 'Diplômés actifs' },
  { value: '14', sup: '', label: "Pays d'Afrique représentés" },
  { value: '96', sup: '%', label: "Taux d'insertion 12 mois" },
];

export default async function HomePage() {
  const concoursDeadline = new Date('2026-08-30T23:59:59.000Z');

  const [featured, books] = await Promise.all([
    prisma.course.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        slug: true,
        title: true,
        kind: true,
        level: true,
        durationHours: true,
        priceXof: true,
        description: true,
      },
    }),
    prisma.resource.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, authors: true, totalCopies: true },
    }),
  ]);

  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            <div>
              <span className="eyebrow" style={{ marginBottom: 24, display: 'inline-flex' }}>
                Promotion 2026 · Inscriptions ouvertes
              </span>
              <h1 className="hero-headline">
                Former l&apos;<span className="accent">orbite</span>
                <br />
                de l&apos;assurance
                <br />
                ouest-africaine.
              </h1>
            </div>
            <div className="hero-meta">
              <p>
                Le CPFA est l&apos;<em>institut de référence au Sénégal</em> pour les métiers de
                l&apos;assurance, de la réassurance et de l&apos;actuariat. Trente ans à former les
                cadres techniques et dirigeants de la zone CIMA.
              </p>
              <div className="row gap-3">
                <Link href="/formations" className="btn btn-primary btn-lg">
                  Catalogue des formations <span className="arrow">→</span>
                </Link>
                <Link href="/a-propos" className="btn btn-ghost btn-lg">
                  Découvrir l&apos;institut
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-orbit">
          <OrbitGraphic />
        </div>
      </section>

      <Marquee />

      <div className="container">
        <div className="stat-row">
          {HOME_STATS.map((s, i) => (
            <div key={i} className="stat">
              <div className="stat-value">
                {s.value}
                {s.sup ? <sup>{s.sup}</sup> : null}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="eyebrow" style={{ marginBottom: 16 }}>
                Programmes phares
              </span>
              <h2>
                Six cursus pour <em className="italic-emph">six trajectoires</em>
                <br />
                de carrière dans l&apos;assurance.
              </h2>
            </div>
            <Link href="/formations" className="btn btn-ghost">
              Voir le catalogue complet <span className="arrow">→</span>
            </Link>
          </div>
          {featured.length === 0 ? (
            <p className="text-soft">Aucune formation publiée pour le moment.</p>
          ) : (
            <div className="formations-grid">
              {featured.map((c) => (
                <FormationCard key={c.slug} f={courseToCard(c)} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="eyebrow" style={{ marginBottom: 16 }}>
                Bibliothèque spécialisée
              </span>
              <h2>
                3 200 ouvrages, mémoires et
                <br />
                études — accès aux abonnés.
              </h2>
            </div>
            <Link href="/bibliotheque" className="btn btn-ghost">
              Explorer le fonds <span className="arrow">→</span>
            </Link>
          </div>
          {books.length === 0 ? (
            <p className="text-soft">Le catalogue se constitue.</p>
          ) : (
            <div className="book-grid">
              {books.map((r) => (
                <Book key={r.id} b={resourceToBook(r)} href={`/bibliotheque/${r.id}`} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="eyebrow" style={{ marginBottom: 16 }}>
                Voix d&apos;alumni
              </span>
              <h2>
                Ils ont étudié au CPFA
                <br />
                <em className="italic-emph">— et l&apos;ont prouvé.</em>
              </h2>
            </div>
          </div>
          <div className="quote-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="quote-card">
                <div
                  style={{
                    fontSize: 28,
                    color: 'var(--orange)',
                    fontFamily: 'var(--serif)',
                    lineHeight: 0,
                  }}
                >
                  &ldquo;
                </div>
                <p className="quote-text">{t.quote}</p>
                <div className="quote-author">
                  <div className="quote-avatar">
                    {t.name
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <div className="quote-name">{t.name}</div>
                    <div className="quote-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingBottom: 0, borderTop: 'none' }}>
        <div className="container">
          <div className="concours-card">
            <div>
              <span className="eyebrow" style={{ marginBottom: 16 }}>
                Concours d&apos;entrée 2026
              </span>
              <div className="concours-headline">
                Le concours
                <br />
                <em className="italic-emph">ferme dans</em>
              </div>
              <Countdown deadline={concoursDeadline} />
              <div className="row gap-3">
                <Link href="/concours" className="btn btn-orange btn-lg">
                  Préparer mon dossier <span className="arrow">→</span>
                </Link>
                <Link href="/concours" className="btn btn-ghost btn-lg">
                  Télécharger les annales
                </Link>
              </div>
            </div>
            <div>
              <p className="fs-17 text-mid" style={{ lineHeight: 1.5 }}>
                Le concours d&apos;entrée au MBA et à la Licence Professionnelle est ouvert aux
                titulaires d&apos;un diplôme reconnu par le CAMES. Quatre épreuves : culture
                économique, mathématiques financières, anglais des affaires et entretien de
                motivation.
              </p>
              <div className="divider" style={{ margin: '24px 0' }}></div>
              <div className="col gap-3">
                {[
                  ['Dépôt en ligne', "jusqu'au 30 août 2026"],
                  ['Épreuves écrites', '12 septembre 2026'],
                  ['Résultats', '25 septembre 2026'],
                  ['Frais de dossier', '25 000 FCFA'],
                ].map(([k, v]) => (
                  <div key={k} className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="text-soft fs-13">{k}</span>
                    <span className="mono fs-13">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
