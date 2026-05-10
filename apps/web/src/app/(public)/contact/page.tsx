import { getTranslations } from 'next-intl/server';
import { ContactBlock } from '@/components/cpfa/contact-block';
import { Breadcrumb } from '@/components/cpfa/breadcrumb';
import { getSetting } from '@/lib/site-settings/get';
import { resolveLocale } from '@/i18n/request';
import { richTags } from '@/lib/i18n-tags';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('contact');
  return { title: `${t('title')} — CPFA` };
}

export default async function ContactPage() {
  const locale = await resolveLocale();
  const [contact, t] = await Promise.all([
    getSetting('footer.contact', locale),
    getTranslations('contact'),
  ]);

  return (
    <div>
      <div className="container page-head">
        <Breadcrumb items={[{ href: '/', label: 'CPFA' }, { label: t('title') }]} />
        <h1>{t.rich('h1', richTags)}</h1>
      </div>

      <div className="container" style={{ paddingBottom: 96 }}>
        <ContactBlock contact={contact} />
      </div>
    </div>
  );
}
