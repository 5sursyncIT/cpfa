'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';

type Initial = {
  firstName: string;
  lastName: string;
  phone: string;
  locale: string;
};

export function UserAdminActions({
  userId,
  canRevokePrivileged,
  isSelf,
  initial,
  twoFactorEnabled,
  hasPassword,
}: {
  userId: string;
  canRevokePrivileged: boolean;
  isSelf: boolean;
  initial: Initial;
  twoFactorEnabled: boolean;
  hasPassword: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateProfile = trpc.users.updateProfile.useMutation();
  const reset2FA = trpc.users.reset2FA.useMutation();
  const forcePwd = trpc.users.forcePasswordReset.useMutation();
  const revoke = trpc.users.revokeAccess.useMutation();

  const pending =
    updateProfile.isPending ||
    reset2FA.isPending ||
    forcePwd.isPending ||
    revoke.isPending;

  function set<K extends keyof Initial>(key: K, value: Initial[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  async function run<T>(fn: () => Promise<T>, msg: string) {
    setError(null);
    setSuccess(null);
    try {
      await fn();
      setSuccess(msg);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    }
  }

  return (
    <div className="col gap-5">
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

      <div className="panel" style={{ padding: 24 }}>
        <h4 style={{ marginBottom: 16 }}>Profil</h4>
        <div className="col gap-3">
          <div className="row gap-3">
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="u-fn">Prénom</label>
              <input
                id="u-fn"
                className="input"
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="u-ln">Nom</label>
              <input
                id="u-ln"
                className="input"
                value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)}
              />
            </div>
          </div>
          <div className="row gap-3">
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="u-phone">Téléphone</label>
              <input
                id="u-phone"
                className="input"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="u-locale">Langue</label>
              <select
                id="u-locale"
                className="select"
                value={form.locale}
                onChange={(e) => set('locale', e.target.value)}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          <div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={pending}
              onClick={() =>
                run(
                  () =>
                    updateProfile.mutateAsync({
                      id: userId,
                      firstName: form.firstName.trim() || null,
                      lastName: form.lastName.trim() || null,
                      phone: form.phone.trim() || null,
                      locale: form.locale,
                    }),
                  'Profil mis à jour.',
                )
              }
            >
              {updateProfile.isPending ? 'Enregistrement…' : 'Enregistrer le profil'}
            </button>
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: 24 }}>
        <h4 style={{ marginBottom: 16 }}>Sécurité</h4>
        <div className="col gap-3">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 500 }}>Authentification à deux facteurs</div>
              <div className="fs-13 text-soft">
                {twoFactorEnabled
                  ? '2FA actif. Réinitialiser oblige le membre à reconfigurer son appareil.'
                  : '2FA désactivé.'}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={pending || !twoFactorEnabled}
              onClick={() => {
                if (!window.confirm('Réinitialiser le 2FA ?')) return;
                run(
                  () => reset2FA.mutateAsync({ id: userId }),
                  '2FA réinitialisé. Le membre devra reconfigurer son appareil.',
                );
              }}
            >
              {reset2FA.isPending ? '…' : 'Réinitialiser'}
            </button>
          </div>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 500 }}>Mot de passe</div>
              <div className="fs-13 text-soft">
                {hasPassword
                  ? 'Effacer force le membre à se connecter via lien magique au prochain login.'
                  : "Aucun mot de passe défini. Le membre se connecte via lien magique ou Google."}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={pending || !hasPassword}
              onClick={() => {
                if (!window.confirm('Effacer le mot de passe ?')) return;
                run(
                  () => forcePwd.mutateAsync({ id: userId }),
                  'Mot de passe effacé. Le membre devra utiliser un lien magique.',
                );
              }}
            >
              {forcePwd.isPending ? '…' : 'Effacer le mot de passe'}
            </button>
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: 24 }}>
        <h4 style={{ marginBottom: 16, color: 'var(--danger)' }}>Zone à risque</h4>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 500 }}>Révoquer l&apos;accès</div>
            <div className="fs-13 text-soft">
              Retire tous les rôles (sauf VISITEUR). Le membre garde son historique mais ne peut
              plus accéder aux espaces protégés.
              {!canRevokePrivileged ? ' Réservé aux Super-admins pour les comptes admin.' : ''}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
            disabled={pending || isSelf}
            onClick={() => {
              if (!window.confirm("Révoquer l'accès de ce compte ?")) return;
              run(() => revoke.mutateAsync({ id: userId }), 'Accès révoqué (rôle VISITEUR).');
            }}
          >
            {revoke.isPending ? '…' : isSelf ? 'Toi-même : impossible' : 'Révoquer'}
          </button>
        </div>
      </div>
    </div>
  );
}
