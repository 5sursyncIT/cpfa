import Link from 'next/link';
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/lib/auth';
import { Button } from '@cpfa/ui';

const navItems = [
  { href: '/me', label: 'Tableau de bord' },
  { href: '/me/bibliotheque', label: 'Mes prêts' },
  { href: '/me/abonnement', label: 'Mon abonnement' },
  { href: '/me/inscriptions', label: 'Mes inscriptions' },
];

export default async function MeLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/me');

  const fullName = session.user.name ?? session.user.email ?? 'Mon espace';

  return (
    <div className="container grid gap-8 py-12 md:grid-cols-[240px_1fr]">
      <aside className="space-y-1">
        <div className="mb-6 rounded-lg border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Connecté</p>
          <p className="mt-1 text-sm font-medium">{fullName}</p>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/' });
          }}
          className="pt-4"
        >
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
            Se déconnecter
          </Button>
        </form>
      </aside>

      <main className="min-h-[60vh]">{children}</main>
    </div>
  );
}
