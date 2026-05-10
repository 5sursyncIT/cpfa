'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Role } from '@cpfa/db';
import { trpc } from '@/lib/trpc';

const NON_PRIVILEGED_ROLES: Role[] = [
  'VISITEUR',
  'CANDIDAT',
  'ABONNE_BIBLIOTHEQUE',
  'FORMATEUR',
  'EDITEUR',
  'BIBLIOTHECAIRE',
  'COMPTABLE',
];
const PRIVILEGED_ROLES: Role[] = ['ADMIN', 'SUPER_ADMIN'];

const ROLE_LABEL: Record<Role, string> = {
  VISITEUR: 'Visiteur',
  CANDIDAT: 'Candidat',
  ABONNE_BIBLIOTHEQUE: 'Abonné bibliothèque',
  FORMATEUR: 'Formateur',
  EDITEUR: 'Éditeur',
  BIBLIOTHECAIRE: 'Bibliothécaire',
  COMPTABLE: 'Comptable',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super-admin',
};

export function NewUserForm({ callerIsSuperAdmin }: { callerIsSuperAdmin: boolean }) {
  const router = useRouter();
  const create = trpc.users.create.useMutation();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    locale: 'fr',
    password: '',
  });
  const [roles, setRoles] = useState<Role[]>(['VISITEUR']);

  const allRoles: Role[] = callerIsSuperAdmin
    ? [...NON_PRIVILEGED_ROLES, ...PRIVILEGED_ROLES]
    : NON_PRIVILEGED_ROLES;

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  function toggleRole(r: Role) {
    setRoles((cur) => (cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (roles.length === 0) {
      setError('Sélectionne au moins un rôle.');
      return;
    }
    if (form.password && form.password.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères.');
      return;
    }
    try {
      const created = await create.mutateAsync({
        email: form.email.trim().toLowerCase(),
        firstName: form.firstName.trim() || undefined,
        lastName: form.lastName.trim() || undefined,
        phone: form.phone.trim() || undefined,
        locale: form.locale,
        roles,
        password: form.password ? form.password : undefined,
      });
      router.replace(`/admin/users/${created.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    }
  }

  return (
    <form className="col gap-5" onSubmit={submit}>
      {error ? (
        <div
          role="alert"
          className="card"
          style={{ borderColor: 'var(--danger)', color: 'var(--danger)', padding: 16 }}
        >
          {error}
        </div>
      ) : null}

      <div className="panel" style={{ padding: 24 }}>
        <h4 style={{ marginBottom: 16 }}>Identité</h4>
        <div className="col gap-3">
          <div>
            <label className="label" htmlFor="nu-email">Email *</label>
            <input
              id="nu-email"
              type="email"
              required
              autoComplete="off"
              className="input"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </div>
          <div className="row gap-3">
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="nu-fn">Prénom</label>
              <input
                id="nu-fn"
                className="input"
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="nu-ln">Nom</label>
              <input
                id="nu-ln"
                className="input"
                value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)}
              />
            </div>
          </div>
          <div className="row gap-3">
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="nu-phone">Téléphone</label>
              <input
                id="nu-phone"
                className="input"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="nu-locale">Langue</label>
              <select
                id="nu-locale"
                className="select"
                value={form.locale}
                onChange={(e) => set('locale', e.target.value)}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: 24 }}>
        <h4 style={{ marginBottom: 16 }}>Rôles *</h4>
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          {allRoles.map((r) => {
            const active = roles.includes(r);
            const isPrivileged = PRIVILEGED_ROLES.includes(r);
            return (
              <button
                key={r}
                type="button"
                onClick={() => toggleRole(r)}
                className={`btn btn-sm ${active ? 'btn-primary' : 'btn-ghost'}`}
                style={isPrivileged ? { borderColor: 'var(--danger)' } : {}}
              >
                {ROLE_LABEL[r]}
              </button>
            );
          })}
        </div>
        {!callerIsSuperAdmin ? (
          <p className="fs-13 text-soft" style={{ marginTop: 12 }}>
            Seul un Super-admin peut accorder ADMIN ou SUPER_ADMIN.
          </p>
        ) : null}
      </div>

      <div className="panel" style={{ padding: 24 }}>
        <h4 style={{ marginBottom: 16 }}>Mot de passe (optionnel)</h4>
        <p className="fs-13 text-soft" style={{ marginBottom: 12 }}>
          Si laissé vide, l&apos;utilisateur se connectera via lien magique ou Google.
        </p>
        <input
          id="nu-pwd"
          type="text"
          autoComplete="new-password"
          className="input"
          placeholder="8 caractères minimum"
          value={form.password}
          onChange={(e) => set('password', e.target.value)}
        />
      </div>

      <div className="row gap-2">
        <button type="submit" className="btn btn-primary" disabled={create.isPending}>
          {create.isPending ? 'Création…' : 'Créer le compte'}
        </button>
        <Link href="/admin/users" className="btn btn-ghost">Annuler</Link>
      </div>
    </form>
  );
}
