import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { auth } from '@/lib/auth';
import { Button } from '@cpfa/ui';

const navLinks = [
  { key: 'home', href: '/' },
  { key: 'courses', href: '/formations' },
  { key: 'seminars', href: '/seminaires' },
  { key: 'library', href: '/bibliotheque' },
  { key: 'exams', href: '/concours' },
  { key: 'contact', href: '/contact' },
] as const;

export async function Header() {
  const session = await auth();
  return (
    <HeaderShell session={session?.user ?? null} />
  );
}

function HeaderShell({ session }: { session: { name?: string | null; email?: string | null } | null }) {
  const t = useTranslations('nav');
  const c = useTranslations('common');

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex flex-col leading-none">
          <span className="text-lg font-bold">{c('appName')}</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {c('tagline')}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {session ? (
            <Button variant="outline" asChild>
              <Link href="/me">{session.name ?? session.email ?? 'Mon espace'}</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/sign-in">{t('signIn')}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
