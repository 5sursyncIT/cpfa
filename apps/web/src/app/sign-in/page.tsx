import Link from 'next/link';
import { redirect } from 'next/navigation';
import { signIn, auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { LogoMark } from '@/components/cpfa/logo-mark';

export const metadata = { title: 'Connexion — CPFA' };

function landingFor(roles: readonly string[] | undefined): string {
  if (!roles) return '/me';
  // Anyone with an admin/library-management permission lands in the
  // backoffice — landing on /me hid the entire admin surface from staff.
  if (
    hasPermission(roles as never, 'admin:any') ||
    hasPermission(roles as never, 'library:manage')
  ) {
    return '/admin';
  }
  return '/me';
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  if (session?.user) {
    redirect(params.callbackUrl ?? landingFor(session.user.roles));
  }

  const callbackUrl = params.callbackUrl ?? '/me';

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
      <div className="card" style={{ width: '100%', maxWidth: 460, padding: 40 }}>
        <Link
          href="/"
          className="brand"
          style={{ marginBottom: 32, display: 'inline-flex' }}
        >
          <div className="brand-mark">
            <LogoMark size={38} />
          </div>
          <div className="brand-text">
            <span className="brand-name">CPFA</span>
            <span className="brand-tag">Centre de Formation · Assurance</span>
          </div>
        </Link>

        <h3 style={{ marginTop: 16 }}>
          Espace <em className="italic-emph">abonné</em>.
        </h3>
        <p className="fs-15 text-mid" style={{ marginTop: 8 }}>
          Accédez à votre espace personnel CPFA.
        </p>

        {params.error ? (
          <p
            className="fs-13"
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 'var(--r-2)',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              background: 'oklch(95% 0.04 25)',
            }}
          >
            Identifiants invalides. Réessayez ou utilisez un autre fournisseur.
          </p>
        ) : null}

        <form
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: callbackUrl });
          }}
          style={{ marginTop: 32 }}
        >
          <button type="submit" className="btn btn-ghost btn-lg" style={{ width: '100%' }}>
            Continuer avec Google
          </button>
        </form>

        <form
          action={async (formData: FormData) => {
            'use server';
            await signIn('resend', {
              email: formData.get('email'),
              redirectTo: callbackUrl,
            });
          }}
          className="row gap-2"
          style={{ marginTop: 12 }}
        >
          <input
            name="email"
            type="email"
            required
            placeholder="vous@exemple.com"
            className="input"
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-ghost btn-lg">
            Lien magique
          </button>
        </form>

        <div
          className="row gap-4"
          style={{
            margin: '24px 0',
            alignItems: 'center',
            color: 'var(--ink-soft)',
            fontSize: 11,
            fontFamily: 'var(--mono)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--line)' }} />
          <span>ou</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--line)' }} />
        </div>

        <form
          action={async (formData: FormData) => {
            'use server';
            await signIn('credentials', {
              email: formData.get('email'),
              password: formData.get('password'),
              redirectTo: callbackUrl,
            });
          }}
          className="col gap-3"
        >
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" required className="input" />
          </div>
          <div>
            <label className="label">Mot de passe</label>
            <input name="password" type="password" required minLength={8} className="input" />
          </div>
          <button type="submit" className="btn btn-primary btn-lg">
            Se connecter <span className="arrow">→</span>
          </button>
        </form>

        <p
          className="fs-13 text-soft"
          style={{ marginTop: 24, textAlign: 'center' }}
        >
          Pas encore de compte ? Contactez l&apos;administration ou{' '}
          <Link href="/formations" style={{ color: 'var(--ink)' }}>
            créez votre dossier de candidature
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
