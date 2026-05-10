import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@cpfa/db';
import { LoanList } from '@/components/cpfa/loan-list';
import { Book } from '@/components/cpfa/book';
import { pickCover, resourceToBook } from '@/lib/cpfa-mappers';
import { resolveLocale } from '@/i18n/request';

export const dynamic = 'force-dynamic';

export default async function MyLibraryPage() {
  const session = (await auth())!;
  const userId = session.user.id;

  const [activeLoans, recommended, subscription, weekDueCount, lateCount, t, locale] =
    await Promise.all([
      prisma.loan.findMany({
        where: { userId, status: 'ACTIVE' },
        orderBy: { dueAt: 'asc' },
        include: { resource: { select: { id: true, title: true, authors: true } } },
      }),
      prisma.resource.findMany({
        orderBy: { createdAt: 'desc' },
        take: 4,
        select: { id: true, title: true, authors: true, totalCopies: true },
      }),
      prisma.subscription.findFirst({
        where: { userId, status: 'ACTIVE' },
        select: { id: true },
      }),
      prisma.loan.count({
        where: {
          userId,
          status: 'ACTIVE',
          dueAt: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.loan.count({
        where: { userId, status: 'ACTIVE', dueAt: { lt: new Date() } },
      }),
      getTranslations('meBibliotheque'),
      resolveLocale(),
    ]);

  const fmtMonth = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', {
    day: '2-digit',
    month: 'short',
  });

  const items = activeLoans.map((l) => ({
    id: l.id,
    title: l.resource.title,
    author: (l.resource.authors[0] ?? '').toUpperCase(),
    due: fmtMonth.format(l.dueAt),
    late: l.dueAt.getTime() < Date.now(),
    cover: pickCover<'navy' | 'orange' | 'ink' | 'cream' | 'olive'>(l.resource.id, [
      'navy',
      'orange',
      'ink',
      'cream',
      'olive',
    ]),
  }));

  return (
    <div className="col gap-5">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'end' }}>
        <h3>{t('h3')}</h3>
        <button type="button" className="btn btn-ghost btn-sm">
          {t('loanHistory')}
        </button>
      </div>

      <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: 180 }}>
          <div className="label">{t('statActive')}</div>
          <div className="serif" style={{ fontSize: 40, marginTop: 8 }}>
            {activeLoans.length} <small className="mono fs-13 text-soft">/ 3</small>
          </div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 180 }}>
          <div className="label">{t('statThisWeek')}</div>
          <div className="serif" style={{ fontSize: 40, marginTop: 8 }}>
            {weekDueCount}
          </div>
        </div>
        <div
          className="card"
          style={{
            flex: 1,
            minWidth: 180,
            borderColor: lateCount > 0 ? 'var(--danger)' : undefined,
          }}
        >
          <div className="label" style={{ color: lateCount > 0 ? 'var(--danger)' : undefined }}>
            {t('statLate')}
          </div>
          <div
            className="serif"
            style={{
              fontSize: 40,
              marginTop: 8,
              color: lateCount > 0 ? 'var(--danger)' : undefined,
            }}
          >
            {lateCount}
          </div>
        </div>
      </div>

      {!subscription ? (
        <div
          className="card"
          style={{
            background: 'var(--orange-soft)',
            borderColor: 'transparent',
            color: 'var(--orange-deep)',
          }}
        >
          <div className="label" style={{ color: 'var(--orange-deep)' }}>
            {t('subRequiredLabel')}
          </div>
          <p className="fs-15" style={{ marginTop: 8 }}>
            {t('subRequiredDesc')}
          </p>
          <Link
            href="/me/abonnement"
            className="btn btn-orange btn-sm"
            style={{ marginTop: 12, alignSelf: 'flex-start' }}
          >
            {t('subRequiredCta')} <span className="arrow">→</span>
          </Link>
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="text-soft">{t('noLoans')}</p>
      ) : (
        <LoanList items={items} />
      )}

      {recommended.length > 0 ? (
        <div>
          <h3 style={{ marginBottom: 16 }}>{t('recommendedHeading')}</h3>
          <div className="book-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {recommended.map((r) => (
              <Book key={r.id} b={resourceToBook(r)} href={`/bibliotheque/${r.id}`} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
