import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@cpfa/db';
import { PaperRow } from '@/components/exam/paper-row';
import { resolveLocale } from '@/i18n/request';

export const dynamic = 'force-dynamic';

export default async function CandidateExamPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in');

  const { id } = await params;
  const [exam, t, tStatus, locale] = await Promise.all([
    prisma.exam.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        title: true,
        examAt: true,
        kind: true,
        published: true,
      },
    }),
    getTranslations('meConcoursDetail'),
    getTranslations('regStatus'),
    resolveLocale(),
  ]);
  if (!exam || !exam.published) notFound();

  const fmt = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', { dateStyle: 'long' });

  const registration = await prisma.registration.findFirst({
    where: { examId: exam.id, userId: session.user.id },
    select: { id: true, status: true },
  });

  const accessLevels: ('PUBLIC' | 'REGISTERED' | 'PAID')[] = ['PUBLIC'];
  if (registration) {
    accessLevels.push('REGISTERED');
    if (registration.status === 'PAID' || registration.status === 'VALIDATED') {
      accessLevels.push('PAID');
    }
  }

  const papers = await prisma.examPaper.findMany({
    where: { examId: exam.id, accessLevel: { in: accessLevels } },
    orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      title: true,
      year: true,
      mimeType: true,
      sizeBytes: true,
      accessLevel: true,
    },
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{exam.kind}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{exam.title}</h1>
        {exam.examAt ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {t('examLabel')}: {fmt.format(exam.examAt)}
          </p>
        ) : null}
        <p className="mt-2 text-sm">
          {t('myFile')}:{' '}
          {registration ? (
            <span className="font-medium">
              {tStatus(
                registration.status as
                  | 'DRAFT'
                  | 'SUBMITTED'
                  | 'PAID'
                  | 'VALIDATED'
                  | 'REJECTED'
                  | 'CANCELLED',
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">{t('notRegistered')}</span>
          )}
        </p>
      </header>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">{t('papersHeading')}</h2>
        {papers.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t('papersEmpty')}</p>
        ) : (
          <ul className="mt-4 divide-y">
            {papers.map((p) => (
              <PaperRow key={p.id} paper={p} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
