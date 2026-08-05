import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@cpfa/db';
import { formatDate } from '@cpfa/lib/i18n';
import { Book } from '@/components/cpfa/book';
import { resolveLocale } from '@/i18n/request';
import { resourceToBook } from '@/lib/cpfa-mappers';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('meLibrary');
  return { title: t('metaTitle') };
}

export default async function MyLibraryPage() {
  const session = (await auth())!;
  const userId = session.user.id;

  const [subscription, recommended, t, locale] = await Promise.all([
    prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      select: { id: true, cardNumber: true, expiresAt: true },
    }),
    prisma.resource.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, title: true, authors: true },
    }),
    getTranslations('meLibrary'),
    resolveLocale(),
  ]);

  return (
    <div className="col gap-5">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'end' }}>
        <h3>{t('title')}</h3>
        <Link href="/bibliotheque" className="btn btn-ghost btn-sm">
          {t('browseCta')} →
        </Link>
      </div>

      {subscription ? (
        <div className="card" style={{ padding: 24 }}>
          <div className="label">{t('activeLabel')}</div>
          <p className="fs-15" style={{ marginTop: 8 }}>
            {t.rich('cardLine', {
              strong: (chunks) => <strong className="mono">{chunks}</strong>,
              number: subscription.cardNumber,
              validity: subscription.expiresAt
                ? t('validity', {
                    date: formatDate(subscription.expiresAt, locale, 'medium'),
                  })
                : '',
            })}
          </p>
          <div className="row gap-2" style={{ marginTop: 12 }}>
            <a href="/api/me/card" target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
              {t('downloadCard')}
            </a>
            <Link href="/me/abonnement" className="btn btn-ghost btn-sm">
              {t('manageCta')}
            </Link>
          </div>
        </div>
      ) : (
        <div
          className="card"
          style={{
            background: 'var(--orange-soft)',
            borderColor: 'transparent',
            color: 'var(--orange-deep)',
            padding: 24,
          }}
        >
          <div className="label" style={{ color: 'var(--orange-deep)' }}>
            {t('noneLabel')}
          </div>
          <p className="fs-15" style={{ marginTop: 8 }}>
            {t('noneBody')}
          </p>
          <Link
            href="/me/abonnement"
            className="btn btn-orange btn-sm"
            style={{ marginTop: 12, alignSelf: 'flex-start' }}
          >
            {t('subscribeCta')} <span className="arrow">→</span>
          </Link>
        </div>
      )}

      {recommended.length > 0 ? (
        <div>
          <h3 style={{ marginBottom: 16 }}>{t('discoverHeading')}</h3>
          <div className="book-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {recommended.map((r) => (
              <Book key={r.id} b={resourceToBook(r, locale)} href={`/bibliotheque/${r.id}`} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
