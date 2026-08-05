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

  const [items, publishedForHome] = await Promise.all([
    prisma.testimonial.findMany({
      where: { locale, ...(scope ? { scope } : {}) },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    }),
    // Mêmes critères que la page d'accueil (voir getHomeTestimonials).
    prisma.testimonial.count({
      where: { locale, published: true, scope: { not: 'TEACHER' } },
    }),
  ]);

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
              className="bg-background rounded-md border px-2 py-1.5 text-sm"
              defaultValue={scope ?? ''}
            >
              <option value="">Tous les profils</option>
              <option value="STUDENT">Étudiants</option>
              <option value="TEACHER">Enseignants</option>
              <option value="PROFESSIONAL">Professionnels</option>
              <option value="PARTNER">Partenaires</option>
            </select>
            <button type="submit" className="bg-background rounded-md border px-3 py-1.5 text-sm">
              Filtrer
            </button>
          </form>
          <CreateTestimonialButton locale={locale} />
        </div>
      </header>

      {/* Le piège à expliquer : sans témoignage publié, la page d'accueil
          montre trois exemples écrits en dur, que personne ne retrouve ici. */}
      {publishedForHome === 0 ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Aucun témoignage n’est publié pour la page d’accueil : elle affiche pour l’instant trois
          exemples. Publiez au moins un témoignage (profil Étudiant, Professionnel ou Partenaire)
          pour qu’ils soient remplacés. Le titre de la section se modifie dans{' '}
          <a href="/admin/settings" className="underline">
            Paramètres du site
          </a>
          .
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">Aucun témoignage dans ce filtre.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((t) => (
            <article key={t.id} className="bg-card rounded-lg border p-4">
              <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <strong>{t.authorName}</strong>
                  {t.authorRole ? (
                    <span className="text-muted-foreground ml-2 text-xs">{t.authorRole}</span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-muted rounded-full px-2 py-0.5">{SCOPE_LABEL[t.scope]}</span>
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
              <blockquote className="text-sm italic">« {t.quote} »</blockquote>
              <footer className="text-muted-foreground mt-3 flex items-center justify-between text-xs">
                <span>
                  Ordre d’affichage : {t.displayOrder} · maj {fmt.format(t.updatedAt)}
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
