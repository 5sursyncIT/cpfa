import { ContactBlock } from '@/components/cpfa/contact-block';
import { Breadcrumb } from '@/components/cpfa/breadcrumb';
import { getSetting } from '@/lib/site-settings/get';
import { resolveLocale } from '@/i18n/request';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Contact — CPFA' };

export default async function ContactPage() {
  const locale = await resolveLocale();
  const contact = await getSetting('footer.contact', locale);

  return (
    <div>
      <div className="container page-head">
        <Breadcrumb items={[{ href: '/', label: 'CPFA' }, { label: 'Contact' }]} />
        <h1>
          Une question, un projet,
          <br />
          <em className="italic-emph">une candidature ?</em>
        </h1>
      </div>

      <div className="container" style={{ paddingBottom: 96 }}>
        <ContactBlock contact={contact} />
      </div>
    </div>
  );
}
