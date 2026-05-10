import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { CreateTestimonialButton } from './create-testimonial-button';
import { TestimonialActions } from './testimonial-actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Témoignages — Admin CPFA' };

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });
const SCOPE_LABEL: Record<string, string> = {
  STUDENT: 'Étudiant',
  TEACHER: 'Enseignant',
  PROFESSIONAL: 'Professionnel',
  PARTNER: 'Partenaire',
};

export default async function AdminTestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string; scope?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/admin/testimonials');
  if (!hasPermission(session.user.roles, 'cms:write')) redirect('/admin');

  const { locale: rawLocale, scope: rawScope } = await searchParams;
  const locale = rawLocale === 'en' ? 'en' : 'fr';
  const scope =
    rawScope && ['STUDENT', 'TEACHER', 'PROFESSIONAL', 'PARTNER'].includes(rawScope)
      ? (rawScope as 'STUDENT' | 'TEACHER' | 'PROFESSIONAL' | 'PARTNER')
      : undefined;

  const items = await prisma.testimonial.findMany({
    where: { locale, ...(scope ? { scope } : {}) },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Témoignages</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <div className="flex gap-1">
            {(['fr', 'en'] as const).map((loc) => (
              <a
                key={loc}
                href={`/admin/testimonials?locale=${loc}${scope ? `&scope=${scope}` : ''}`}
                className={
                  'rounded-md border px-3 py-1.5 ' +
                  (loc === locale ? 'bg-primary text-primary-foreground' : 'bg-background')
                }
              >
                {loc.toUpperCase()}
              </a>
            ))}
          </div>
          <form method="get" action="/admin/testimonials" className="flex gap-1">
            <input type="hidden" name="locale" value={locale} />
            <select
              name="scope"
              className="rounded-md border bg-background px-2 py-1.5 text-sm"
              defaultValue={scope ?? ''}
            >
              <option value="">Tous les scopes</option>
              <option value="STUDENT">Étudiants</option>
              <option value="TEACHER">Enseignants</option>
              <option value="PROFESSIONAL">Professionnels</option>
              <option value="PARTNER">Partenaires</option>
            </select>
            <button
              type="submit"
              className="rounded-md border bg-background px-3 py-1.5 text-sm"
            >
              Filtrer
            </button>
          </form>
          <CreateTestimonialButton locale={locale} />
        </div>
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun témoignage dans ce filtre.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((t) => (
            <article key={t.id} className="rounded-lg border bg-card p-4">
              <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <strong>{t.authorName}</strong>
                  {t.authorRole ? (
                    <span className="ml-2 text-xs text-muted-foreground">{t.authorRole}</span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    {SCOPE_LABEL[t.scope]}
                  </span>
                  <span
                    className={
                      'rounded-full px-2 py-0.5 ' +
                      (t.published
                        ? 'bg-emerald-500/10 text-emerald-700'
                        : 'bg-muted text-muted-foreground')
                    }
                  >
                    {t.published ? 'Publié' : 'Brouillon'}
                  </span>
                </div>
              </header>
              <blockquote className="italic text-sm">« {t.quote} »</blockquote>
              <footer className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Ordre : {t.displayOrder} · maj {fmt.format(t.updatedAt)}
                </span>
                <TestimonialActions
                  id={t.id}
                  published={t.published}
                  initial={{
                    scope: t.scope,
                    authorName: t.authorName,
                    authorRole: t.authorRole ?? '',
                    quote: t.quote,
                    locale: t.locale as 'fr' | 'en',
                    displayOrder: t.displayOrder,
                  }}
                />
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
