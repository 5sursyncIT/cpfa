import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { auth, signOut } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { Button } from '@cpfa/ui';

const navItems = [
  { href: '/admin', label: 'Tableau de bord' },
  { href: '/admin/loans', label: 'Prêts' },
  { href: '/admin/registrations', label: 'Inscriptions' },
  { href: '/admin/payments', label: 'Paiements' },
  { href: '/admin/exams', label: 'Concours' },
  { href: '/admin/articles', label: 'Actualités' },
  { href: '/admin/cms', label: 'Pages CMS' },
  { href: '/admin/users', label: 'Utilisateurs' },
  { href: '/admin/audit', label: 'Audit' },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin');
  if (!hasPermission(session.user.roles, 'admin:any') && !hasPermission(session.user.roles, 'library:manage')) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="container flex h-14 items-center justify-between gap-6">
          <Link href="/admin" className="text-sm font-bold uppercase tracking-widest">
            CPFA · Admin
          </Link>
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/' });
            }}
          >
            <Button type="submit" variant="ghost" size="sm">
              Se déconnecter
            </Button>
          </form>
        </div>
      </header>
      <div className="container grid gap-8 py-8 md:grid-cols-[220px_1fr]">
        <aside>
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
        </aside>
        <main className="rounded-lg border bg-background p-6">{children}</main>
      </div>
    </div>
  );
}
