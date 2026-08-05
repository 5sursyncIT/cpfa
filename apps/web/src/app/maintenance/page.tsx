import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LogoMark } from '@/components/cpfa/logo-mark';
import { getMaintenanceSettings, hasMaintenanceBypass } from '@/lib/maintenance/guard';
import { unlockMaintenanceAction } from './actions';

// Lives outside the (public) route group on purpose: the gate is enforced by
// that group's layout, so the splash page must not sit under it.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Site en maintenance — CPFA',
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  invalid: 'Identifiant ou mot de passe incorrect.',
  rate: 'Trop de tentatives. Merci de réessayer dans quelques minutes.',
};

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const settings = await getMaintenanceSettings();
  if (!settings.enabled) redirect('/');
  if (await hasMaintenanceBypass()) redirect('/');

  const { error } = await searchParams;
  const errorMessage = error ? (ERRORS[error] ?? ERRORS.invalid) : null;

  return (
    <main
      className="container"
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 560, padding: 40 }}>
        <div className="brand" style={{ marginBottom: 32, display: 'inline-flex' }}>
          <div className="brand-mark">
            <LogoMark size={38} />
          </div>
          <div className="brand-text">
            <span className="brand-name">CPFA</span>
            <span className="brand-tag">
              Centre de Perfectionnement et de Formation en Assurance
            </span>
          </div>
        </div>

        <h3 style={{ marginTop: 16 }}>{settings.title}</h3>

        {settings.message ? (
          <p className="fs-15 text-mid" style={{ marginTop: 12, whiteSpace: 'pre-line' }}>
            {settings.message}
          </p>
        ) : null}

        {settings.reopensAt ? (
          <p className="fs-15" style={{ marginTop: 12 }}>
            <strong>Retour prévu :</strong> {settings.reopensAt}
          </p>
        ) : null}

        {settings.contactEmail ? (
          <p className="fs-13 text-soft" style={{ marginTop: 12 }}>
            Une question urgente ?{' '}
            <a href={`mailto:${settings.contactEmail}`} style={{ color: 'var(--ink)' }}>
              {settings.contactEmail}
            </a>
          </p>
        ) : null}

        <div
          className="row gap-4"
          style={{
            margin: '32px 0 24px',
            alignItems: 'center',
            color: 'var(--ink-soft)',
            fontSize: 11,
            fontFamily: 'var(--mono)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--line)' }} />
          <span>Accès réservé</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--line)' }} />
        </div>

        {errorMessage ? (
          <p
            className="fs-13"
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 'var(--r-2)',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              background: 'oklch(95% 0.04 25)',
            }}
          >
            {errorMessage}
          </p>
        ) : null}

        <form action={unlockMaintenanceAction} className="col gap-3">
          <div>
            <label className="label" htmlFor="maintenance-email">
              E-mail
            </label>
            <input
              id="maintenance-email"
              name="email"
              type="email"
              autoComplete="username"
              className="input"
            />
            <p className="fs-13 text-soft" style={{ marginTop: 6 }}>
              Laissez ce champ vide si l&apos;on vous a communiqué uniquement un mot de passe
              d&apos;aperçu.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="maintenance-password">
              Mot de passe
            </label>
            <input
              id="maintenance-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="input"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg">
            Accéder au site <span className="arrow">→</span>
          </button>
        </form>
      </div>
    </main>
  );
}
