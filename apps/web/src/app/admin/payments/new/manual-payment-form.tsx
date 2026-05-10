'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';

type User = { id: string; name: string; email: string };

const PURPOSE_OPTIONS: Array<[string, string]> = [
  ['COURSE_REGISTRATION', 'Formation'],
  ['SEMINAR_REGISTRATION', 'Séminaire'],
  ['EXAM_FEE', 'Concours'],
  ['LIBRARY_SUBSCRIPTION', 'Abonnement bibliothèque'],
  ['LIBRARY_PENALTY', 'Pénalité bibliothèque'],
  ['OTHER', 'Autre'],
];

const PROVIDER_OPTIONS: Array<[string, string]> = [
  ['CASH', 'Espèces (comptoir)'],
  ['BANK_TRANSFER', 'Virement bancaire'],
  ['WAVE', 'Wave (saisie manuelle)'],
  ['ORANGE_MONEY', 'Orange Money (saisie manuelle)'],
  ['PAYTECH', 'PayTech (saisie manuelle)'],
  ['STATIC_QR', 'QR statique'],
];

export function ManualPaymentForm({ users }: { users: User[] }) {
  const router = useRouter();
  const [userQuery, setUserQuery] = useState('');
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState(0);
  const [provider, setProvider] = useState('CASH');
  const [purpose, setPurpose] = useState('OTHER');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const record = trpc.payments.manualRecord.useMutation();

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users.slice(0, 30);
    return users
      .filter(
        (u) =>
          u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
      )
      .slice(0, 30);
  }, [userQuery, users]);

  const selectedUser = users.find((u) => u.id === userId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!userId) {
      setError('Sélectionne un utilisateur.');
      return;
    }
    if (amount <= 0) {
      setError('Montant invalide.');
      return;
    }
    try {
      const created = await record.mutateAsync({
        userId,
        amountXof: amount,
        provider: provider as 'CASH',
        purpose: purpose as 'OTHER',
        notes: notes.trim() || undefined,
      });
      setSuccess(`Paiement enregistré : ${created.amountXof.toLocaleString('fr-FR')} FCFA.`);
      setUserId('');
      setUserQuery('');
      setAmount(0);
      setNotes('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="col gap-5">
      {error ? (
        <div role="alert" className="card" style={{ borderColor: 'var(--danger)', color: 'var(--danger)', padding: 16 }}>
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

      <div className="panel" style={{ padding: 24 }}>
        <h4 style={{ marginBottom: 16 }}>1. Client</h4>
        <input
          className="input"
          placeholder="Recherche par nom ou email…"
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
          style={{ marginBottom: 12 }}
        />
        <div
          style={{
            maxHeight: 240,
            overflowY: 'auto',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-2)',
          }}
        >
          {filteredUsers.length === 0 ? (
            <p className="text-soft fs-13" style={{ padding: 16 }}>Aucun utilisateur ne correspond.</p>
          ) : (
            filteredUsers.map((u) => (
              <label
                key={u.id}
                htmlFor={`u-${u.id}`}
                style={{
                  display: 'block',
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--line-soft)',
                  cursor: 'pointer',
                  background: userId === u.id ? 'var(--bg-soft)' : 'transparent',
                }}
              >
                <input
                  id={`u-${u.id}`}
                  type="radio"
                  name="user"
                  checked={userId === u.id}
                  onChange={() => setUserId(u.id)}
                  style={{ marginRight: 8 }}
                />
                <span style={{ fontWeight: 500 }}>{u.name}</span>
                <span className="fs-13 text-soft"> · {u.email}</span>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="panel" style={{ padding: 24 }}>
        <h4 style={{ marginBottom: 16 }}>2. Détails</h4>
        <div className="col gap-3">
          <div className="row gap-3">
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="p-amount">Montant (FCFA) *</label>
              <input
                id="p-amount"
                type="number"
                min={1}
                className="input"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="p-purpose">Objet *</label>
              <select
                id="p-purpose"
                className="select"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              >
                {PURPOSE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="p-provider">Mode *</label>
              <select
                id="p-provider"
                className="select"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                {PROVIDER_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="p-notes">Notes (référence externe, n° de reçu…)</label>
            <textarea
              id="p-notes"
              className="textarea"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="row gap-3" style={{ alignItems: 'center' }}>
        <button type="submit" className="btn btn-primary" disabled={record.isPending || !userId || amount <= 0}>
          {record.isPending ? 'Enregistrement…' : 'Enregistrer le paiement'}
        </button>
        <Link href="/admin/payments" className="btn btn-ghost">Annuler</Link>
        {selectedUser ? (
          <span className="fs-13 text-soft">
            Pour {selectedUser.name} · {amount.toLocaleString('fr-FR')} FCFA
          </span>
        ) : null}
      </div>
    </form>
  );
}
