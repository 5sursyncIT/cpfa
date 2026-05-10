'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';

type Sub = {
  id: string;
  cardNumber: string;
  tier: string;
  name: string;
  email: string;
};
type Res = {
  id: string;
  title: string;
  authors: string[];
  totalCopies: number;
  activeLoans: number;
};

const TIER_LABEL: Record<string, string> = {
  STUDENT: 'Étudiant',
  PROFESSIONAL: 'Professionnel',
  HOME_LOAN: 'Domicile',
};

export function BorrowFlow({
  subscriptions,
  resources,
}: {
  subscriptions: Sub[];
  resources: Res[];
}) {
  const router = useRouter();
  const [subId, setSubId] = useState('');
  const [resId, setResId] = useState('');
  const [days, setDays] = useState(14);
  const [subQuery, setSubQuery] = useState('');
  const [resQuery, setResQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const borrow = trpc.library.borrow.useMutation();

  const filteredSubs = useMemo(() => {
    const q = subQuery.trim().toLowerCase();
    if (!q) return subscriptions.slice(0, 50);
    return subscriptions
      .filter(
        (s) =>
          s.cardNumber.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q),
      )
      .slice(0, 50);
  }, [subQuery, subscriptions]);

  const filteredRes = useMemo(() => {
    const q = resQuery.trim().toLowerCase();
    if (!q) return resources.slice(0, 50);
    return resources
      .filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.authors.some((a) => a.toLowerCase().includes(q)),
      )
      .slice(0, 50);
  }, [resQuery, resources]);

  const selectedSub = subscriptions.find((s) => s.id === subId);
  const selectedRes = resources.find((r) => r.id === resId);
  const available = selectedRes
    ? Math.max(0, selectedRes.totalCopies - selectedRes.activeLoans)
    : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!subId || !resId) {
      setError('Sélectionne un abonné et un ouvrage.');
      return;
    }
    try {
      const loan = await borrow.mutateAsync({
        subscriptionId: subId,
        resourceId: resId,
        durationDays: days,
      });
      setSuccess(
        `Prêt enregistré · échéance le ${new Date(loan.dueAt).toLocaleDateString('fr-FR')}.`,
      );
      setSubId('');
      setResId('');
      setSubQuery('');
      setResQuery('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="col gap-5">
      {error ? (
        <div
          role="alert"
          className="card"
          style={{ borderColor: 'var(--danger)', color: 'var(--danger)', padding: 16 }}
        >
          {error}
        </div>
      ) : null}
      {success ? (
        <div
          role="status"
          aria-live="polite"
          className="card"
          style={{ borderColor: 'var(--success)', color: 'var(--success)', padding: 16 }}
        >
          {success}
        </div>
      ) : null}

      <div className="admin-grid-2">
        <div className="panel" style={{ padding: 24 }}>
          <h4 style={{ marginBottom: 16 }}>1. Abonné</h4>
          <input
            className="input"
            placeholder="Rechercher par nom, email, n° de carte…"
            value={subQuery}
            onChange={(e) => setSubQuery(e.target.value)}
            aria-label="Recherche d'abonné"
            style={{ marginBottom: 12 }}
          />
          <div
            style={{
              maxHeight: 300,
              overflowY: 'auto',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-2)',
            }}
          >
            {filteredSubs.length === 0 ? (
              <p className="text-soft fs-13" style={{ padding: 16 }}>
                Aucun abonné actif ne correspond.
              </p>
            ) : (
              filteredSubs.map((s) => (
                <label
                  key={s.id}
                  htmlFor={`sub-${s.id}`}
                  style={{
                    display: 'block',
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--line-soft)',
                    cursor: 'pointer',
                    background: subId === s.id ? 'var(--bg-soft)' : 'transparent',
                  }}
                >
                  <input
                    id={`sub-${s.id}`}
                    type="radio"
                    name="subscription"
                    checked={subId === s.id}
                    onChange={() => setSubId(s.id)}
                    style={{ marginRight: 8 }}
                  />
                  <span style={{ fontWeight: 500 }}>{s.name}</span>
                  <span className="fs-13 text-soft"> · {s.email}</span>
                  <div className="mono fs-13 text-soft">
                    {s.cardNumber} · {TIER_LABEL[s.tier] ?? s.tier}
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="panel" style={{ padding: 24 }}>
          <h4 style={{ marginBottom: 16 }}>2. Ouvrage</h4>
          <input
            className="input"
            placeholder="Rechercher par titre ou auteur…"
            value={resQuery}
            onChange={(e) => setResQuery(e.target.value)}
            aria-label="Recherche d'ouvrage"
            style={{ marginBottom: 12 }}
          />
          <div
            style={{
              maxHeight: 300,
              overflowY: 'auto',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-2)',
            }}
          >
            {filteredRes.length === 0 ? (
              <p className="text-soft fs-13" style={{ padding: 16 }}>
                Aucun ouvrage ne correspond.
              </p>
            ) : (
              filteredRes.map((r) => {
                const avail = Math.max(0, r.totalCopies - r.activeLoans);
                const out = avail === 0;
                return (
                  <label
                    key={r.id}
                    htmlFor={`res-${r.id}`}
                    style={{
                      display: 'block',
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--line-soft)',
                      cursor: out ? 'not-allowed' : 'pointer',
                      opacity: out ? 0.5 : 1,
                      background: resId === r.id ? 'var(--bg-soft)' : 'transparent',
                    }}
                  >
                    <input
                      id={`res-${r.id}`}
                      type="radio"
                      name="resource"
                      checked={resId === r.id}
                      onChange={() => !out && setResId(r.id)}
                      disabled={out}
                      style={{ marginRight: 8 }}
                    />
                    <span style={{ fontWeight: 500 }}>{r.title}</span>
                    <div className="fs-13 text-soft">
                      {r.authors.join(', ') || '—'} · {avail}/{r.totalCopies} dispo
                      {out ? ' · épuisé' : ''}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: 24 }}>
        <h4 style={{ marginBottom: 16 }}>3. Confirmer</h4>
        <div className="row gap-4" style={{ flexWrap: 'wrap', alignItems: 'end' }}>
          <div>
            <label className="label" htmlFor="borrow-days">Durée (jours)</label>
            <input
              id="borrow-days"
              type="number"
              min={1}
              max={30}
              className="input"
              value={days}
              onChange={(e) => setDays(Number(e.target.value) || 14)}
              style={{ width: 100 }}
            />
          </div>
          <div className="fs-13 text-soft" style={{ flex: 1, minWidth: 200 }}>
            {selectedSub ? (
              <div>
                Abonné : <strong>{selectedSub.name}</strong> · {selectedSub.cardNumber}
              </div>
            ) : (
              <div>Sélectionne un abonné.</div>
            )}
            {selectedRes ? (
              <div>
                Ouvrage : <strong>{selectedRes.title}</strong> · {available}/
                {selectedRes.totalCopies} dispo
              </div>
            ) : (
              <div>Sélectionne un ouvrage.</div>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={borrow.isPending || !subId || !resId}
          >
            {borrow.isPending ? 'Enregistrement…' : 'Enregistrer le prêt'}
          </button>
        </div>
      </div>
    </form>
  );
}
