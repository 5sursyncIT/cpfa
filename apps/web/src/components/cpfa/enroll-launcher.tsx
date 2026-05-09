'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { fmtXof } from '@/lib/cpfa-mappers';

type Session = { id: string; label: string };

const ENROLL_FEE_XOF = 25_000;

export function EnrollLauncher({
  courseId,
  courseTitle,
  priceXof,
  sessions,
}: {
  courseId: string;
  courseTitle: string;
  priceXof: number;
  sessions: Session[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="btn btn-orange btn-lg"
        onClick={() => setOpen(true)}
      >
        Démarrer une candidature <span className="arrow">→</span>
      </button>
      {open ? (
        <EnrollModal
          courseId={courseId}
          courseTitle={courseTitle}
          priceXof={priceXof}
          sessions={sessions}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function EnrollModal({
  courseId,
  courseTitle,
  priceXof,
  sessions,
  onClose,
}: {
  courseId: string;
  courseTitle: string;
  priceXof: number;
  sessions: Session[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [pay, setPay] = useState<'wave' | 'om' | 'card' | 'bank'>('wave');
  const [sessionId, setSessionId] = useState<string | undefined>(sessions[0]?.id);
  const [reference, setReference] = useState<string | null>(null);

  const register = trpc.registrations.registerForCourse.useMutation();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (reference) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="row" style={{ justifyContent: 'center', padding: '24px 0' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'var(--orange-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--orange-deep)"
                strokeWidth="2.5"
              >
                <path d="M5 12l5 5L20 7" />
              </svg>
            </div>
          </div>
          <h3 style={{ textAlign: 'center' }}>Candidature reçue</h3>
          <p
            className="fs-15 text-mid"
            style={{ textAlign: 'center', maxWidth: 380, margin: '0 auto' }}
          >
            Votre dossier a bien été transmis. Vous recevrez un email de confirmation sous 48
            heures à l&apos;adresse renseignée. Référence :{' '}
            <span className="mono">{reference}</span>
          </p>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => {
              onClose();
              router.push(`/me/inscriptions/${reference}`);
            }}
          >
            Voir mon dossier
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">Étape {step + 1} sur 3</span>
            <h3 style={{ marginTop: 8 }}>
              {step === 0
                ? 'Vos informations'
                : step === 1
                  ? 'Pièces justificatives'
                  : 'Paiement des frais de dossier'}
            </h3>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="steps">
          <div
            className={'step' + (step >= 0 ? (step > 0 ? ' done' : ' active') : '')}
          ></div>
          <div
            className={'step' + (step >= 1 ? (step > 1 ? ' done' : ' active') : '')}
          ></div>
          <div className={'step' + (step >= 2 ? ' active' : '')}></div>
        </div>

        {step === 0 && (
          <div className="col gap-4">
            <div className="row gap-3">
              <div style={{ flex: 1 }}>
                <label className="label">Prénom</label>
                <input className="input" placeholder="Aïssatou" />
              </div>
              <div style={{ flex: 1 }}>
                <label className="label">Nom</label>
                <input className="input" placeholder="Ndiaye" />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="vous@exemple.sn" />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input className="input" placeholder="+221 77 000 00 00" />
            </div>
            {sessions.length > 1 ? (
              <div>
                <label className="label">Session souhaitée</label>
                <select
                  className="select"
                  value={sessionId ?? ''}
                  onChange={(e) => setSessionId(e.target.value || undefined)}
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div>
              <label className="label">Diplôme le plus élevé</label>
              <select className="select" defaultValue="m1">
                <option value="l3">Licence (Bac+3)</option>
                <option value="m1">Master 1 (Bac+4)</option>
                <option value="m2">Master 2 / Ingénieur (Bac+5)</option>
                <option value="phd">Doctorat</option>
              </select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="col gap-3">
            {[
              { name: 'CV à jour', req: true },
              { name: 'Copie du diplôme et relevés', req: true },
              { name: 'Lettre de motivation', req: true },
              { name: "Pièce d'identité", req: true },
              { name: 'Justificatif de financement (employeur ou perso)', req: false },
            ].map((d) => (
              <div
                key={d.name}
                className="row gap-3"
                style={{
                  padding: '14px 16px',
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 6,
                    background: 'var(--bg-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M14 3v5h5M5 21V3h9l5 5v13H5z" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="fs-14" style={{ fontWeight: 500 }}>
                    {d.name}{' '}
                    {d.req ? <span style={{ color: 'var(--orange-deep)' }}>*</span> : null}
                  </div>
                  <div className="fs-13 text-soft">PDF, JPG ou PNG · max 5 MB</div>
                </div>
                <button type="button" className="btn btn-ghost btn-sm">
                  Téléverser
                </button>
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="col gap-4">
            <div
              className="row"
              style={{
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'var(--bg-soft)',
                borderRadius: 8,
              }}
            >
              <div>
                <div className="fs-13 text-soft">Frais de dossier</div>
                <div className="fs-15" style={{ fontWeight: 500 }}>
                  {courseTitle}
                </div>
              </div>
              <div className="serif" style={{ fontSize: 32, lineHeight: 1 }}>
                {ENROLL_FEE_XOF.toLocaleString('fr-FR')}{' '}
                <small className="mono fs-13 text-soft">FCFA</small>
              </div>
            </div>
            <p className="fs-13 text-soft">
              Frais de scolarité (réglés après admission) :{' '}
              <strong>{fmtXof(priceXof)}</strong>.
            </p>
            <div>
              <label className="label">Mode de paiement</label>
              <div className="pay-grid">
                {[
                  { id: 'wave' as const, name: 'Wave', desc: 'Mobile money — instantané' },
                  { id: 'om' as const, name: 'Orange Money', desc: 'OM Pay — *144#' },
                  { id: 'card' as const, name: 'Carte bancaire', desc: 'Visa / Mastercard' },
                  { id: 'bank' as const, name: 'Virement', desc: 'CBAO — délai 24-48h' },
                ].map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    className={'pay-tile' + (pay === p.id ? ' selected' : '')}
                    onClick={() => setPay(p.id)}
                  >
                    <div className={'pay-tile-logo ' + p.id}>
                      {p.id === 'om' ? 'OM' : p.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="fs-14" style={{ fontWeight: 500 }}>
                      {p.name}
                    </div>
                    <div className="fs-13 text-soft">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            {pay === 'wave' || pay === 'om' ? (
              <div>
                <label className="label">
                  Numéro {pay === 'wave' ? 'Wave' : 'Orange Money'}
                </label>
                <input className="input" placeholder="+221 77 000 00 00" />
                <p className="fs-13 text-soft" style={{ marginTop: 8 }}>
                  Vous recevrez une notification {pay === 'wave' ? 'Wave' : 'Orange Money'} sur
                  votre téléphone pour confirmer.
                </p>
              </div>
            ) : null}
            {register.error ? (
              <p className="fs-13" style={{ color: 'var(--danger)' }}>
                {register.error.message}
              </p>
            ) : null}
          </div>
        )}

        <div
          className="row gap-3"
          style={{ justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: 16 }}
        >
          {step > 0 ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setStep((step - 1) as 0 | 1)}
            >
              ← Précédent
            </button>
          ) : (
            <span></span>
          )}
          {step < 2 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setStep((step + 1) as 1 | 2)}
            >
              Continuer <span className="arrow">→</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-orange"
              disabled={register.isPending}
              onClick={async () => {
                try {
                  const res = await register.mutateAsync({
                    courseId,
                    sessionId,
                  });
                  setReference(res.registration.id);
                } catch {
                  /* error displayed inline */
                }
              }}
            >
              {register.isPending
                ? 'Traitement…'
                : `Payer ${ENROLL_FEE_XOF.toLocaleString('fr-FR')} FCFA`}{' '}
              {!register.isPending ? <span className="arrow">→</span> : null}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
