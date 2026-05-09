import { ContactBlock } from '@/components/cpfa/contact-block';

export const metadata = { title: 'Contact — CPFA' };

export default function ContactPage() {
  return (
    <div>
      <div className="container page-head">
        <div className="breadcrumb">
          CPFA · <span>Contact</span>
        </div>
        <h1>
          Une question, un projet,
          <br />
          <em className="italic-emph">une candidature ?</em>
        </h1>
      </div>

      <div className="container" style={{ paddingBottom: 96 }}>
        <ContactBlock />
      </div>
    </div>
  );
}
