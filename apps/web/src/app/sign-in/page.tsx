import { redirect } from 'next/navigation';
import { signIn, auth } from '@/lib/auth';
import { Button } from '@cpfa/ui';

export const metadata = { title: 'Connexion — CPFA' };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  if (session?.user) redirect(params.callbackUrl ?? '/me');

  const callbackUrl = params.callbackUrl ?? '/me';

  return (
    <main className="container flex min-h-screen items-center justify-center py-16">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Connexion</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Accédez à votre espace personnel CPFA.
        </p>

        {params.error ? (
          <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            Identifiants invalides. Réessayez ou utilisez un autre fournisseur.
          </p>
        ) : null}

        <form
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: callbackUrl });
          }}
          className="mt-8"
        >
          <Button type="submit" size="lg" variant="outline" className="w-full">
            Continuer avec Google
          </Button>
        </form>

        <form
          action={async (formData: FormData) => {
            'use server';
            await signIn('resend', {
              email: formData.get('email'),
              redirectTo: callbackUrl,
            });
          }}
          className="mt-3 flex gap-2"
        >
          <input
            name="email"
            type="email"
            required
            placeholder="vous@exemple.com"
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button type="submit" size="lg" variant="outline">
            Lien magique
          </Button>
        </form>

        <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-widest text-muted-foreground">
          <hr className="flex-1" />
          <span>ou</span>
          <hr className="flex-1" />
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
          className="space-y-3"
        >
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Email</span>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Mot de passe</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <Button type="submit" size="lg" className="w-full">
            Se connecter
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Pas encore de compte ? Contactez l’administration ou créez votre dossier de candidature.
        </p>
      </div>
    </main>
  );
}
