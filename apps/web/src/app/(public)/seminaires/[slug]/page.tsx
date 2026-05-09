import { notFound } from 'next/navigation';
import { prisma } from '@cpfa/db';
import { RegisterSeminarButton } from '@/components/training/register-seminar-button';
import { fmtXof } from '@/lib/cpfa-mappers';

export const dynamic = 'force-dynamic';

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const seminar = await prisma.seminar.findUnique({ where: { slug }, select: { title: true } });
  return { title: seminar ? `${seminar.title} — CPFA` : 'Séminaire introuvable — CPFA' };
}

export default async function SeminarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const seminar = await prisma.seminar.findUnique({
    where: { slug },
    include: { speakers: true },
  });
  if (!seminar || !seminar.published) notFound();

  const taken = await prisma.registration.count({
    where: { seminarId: seminar.id, status: { in: ['SUBMITTED', 'PAID', 'VALIDATED'] } },
  });
  const seatsLeft = Math.max(0, seminar.capacity - taken);

  return (
    <div>
      <div className="container">
        <div className="page-head" style={{ paddingBottom: 0 }}>
          <div className="breadcrumb">
            CPFA · Séminaires · <span>{seminar.title}</span>
          </div>
          <div className="detail-hero">
            <div>
              <span
                className="pill"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  color: 'white',
                  borderColor: 'transparent',
                  marginBottom: 16,
                }}
              >
                Séminaire · {fmt.format(seminar.startsAt)}
              </span>
              <h1>{seminar.title}</h1>
            </div>
          </div>
        </div>

        <div className="detail-grid">
          <div>
            {seminar.description ? (
              <p
                className="fs-17 text-mid"
                style={{ lineHeight: 1.55, marginBottom: 32, maxWidth: 720 }}
              >
                {seminar.description}
              </p>
            ) : null}

            {seminar.speakers.length > 0 ? (
              <>
                <h3 style={{ marginBottom: 24 }}>
                  Intervenant·e·s — <em className="italic-emph">premier plan</em>
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 16,
                  }}
                >
                  {seminar.speakers.map((sp) => (
                    <div key={sp.id} className="card">
                      <h4 style={{ fontSize: 18 }}>{sp.fullName}</h4>
                      {sp.title ? (
                        <p className="fs-13 text-soft" style={{ marginTop: 4 }}>
                          {sp.title}
                        </p>
                      ) : null}
                      {sp.bio ? (
                        <p className="fs-14 text-mid" style={{ marginTop: 12, lineHeight: 1.5 }}>
                          {sp.bio}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          <aside className="enroll-card">
            <div>
              <div className="label">Frais d&apos;inscription</div>
              <div className="enroll-price">
                {seminar.priceXof === 0
                  ? 'Gratuit'
                  : seminar.priceXof.toLocaleString('fr-FR')}{' '}
                {seminar.priceXof === 0 ? null : <small>FCFA</small>}
              </div>
            </div>
            <div className="enroll-stat-row">
              <span className="label">Quand</span>
              <span className="value">{fmt.format(seminar.startsAt)}</span>
            </div>
            {seminar.location ? (
              <div className="enroll-stat-row">
                <span className="label">Lieu</span>
                <span className="value">{seminar.location}</span>
              </div>
            ) : null}
            <div
              className="enroll-stat-row"
              style={{ borderBottom: '1px solid var(--line-soft)' }}
            >
              <span className="label">Disponibilité</span>
              <span className="value">
                {seatsLeft > 0 ? `${seatsLeft} place(s)` : 'Complet'}
              </span>
            </div>
            <RegisterSeminarButton seminarId={seminar.id} disabled={seatsLeft === 0} />
            <p className="fs-13 text-soft" style={{ lineHeight: 1.4 }}>
              Tarif réduit -30% pour les abonnés CPFA. Total à régler :{' '}
              <strong>{fmtXof(seminar.priceXof)}</strong>.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
