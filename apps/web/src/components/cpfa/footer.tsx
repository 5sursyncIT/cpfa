import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { LogoMark } from './logo-mark';
import { LocaleSwitcher } from './locale-switcher';
import { getSetting } from '@/lib/site-settings/get';
import { getPartners } from '@/lib/content-blocks';
import { resolveLocale } from '@/i18n/request';
import { mediaUrl } from '@/lib/media';

export async function CpfaFooter() {
  const locale = await resolveLocale();
  const [contact, socials, partnerLogos, t, tFooter] = await Promise.all([
    getSetting('footer.contact'),
    getSetting('footer.socials'),
    getPartners(locale),
    getTranslations('common'),
    getTranslations('footer'),
  ]);
  const socialEntries = (
    [
      { key: 'facebook', label: 'Facebook', url: socials.facebook },
      { key: 'linkedin', label: 'LinkedIn', url: socials.linkedin },
      { key: 'instagram', label: 'Instagram', url: socials.instagram },
    ] as const
  ).filter((s) => s.url);

  return (
    <footer className="footer">
      <div className="container">
        {/* Bandeau partenaires (§1.4 du Directeur). Affiche le logo si la
            clé média est renseignée, sinon le nom en serif comme fallback. */}
        {partnerLogos.length > 0 ? (
          <div
            style={{
              borderBottom: '1px solid oklch(35% 0.04 258)',
              padding: '20px 0',
              marginBottom: 32,
            }}
          >
            <div
              className="fs-13"
              style={{
                color: 'oklch(70% 0.02 258)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 12,
              }}
            >
              {tFooter('partnersLabel')}
            </div>
            <div
              className="row"
              style={{
                gap: 32,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              {partnerLogos.map((p) => {
                const src = mediaUrl(p.logoKey || null);
                const inner = src ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={src}
                    alt={p.name}
                    style={{
                      height: 36,
                      maxWidth: 140,
                      objectFit: 'contain',
                      filter: 'brightness(0) invert(1)',
                      opacity: 0.85,
                    }}
                  />
                ) : (
                  <span
                    className="serif"
                    style={{
                      fontSize: 18,
                      color: 'oklch(85% 0.01 80)',
                    }}
                  >
                    {p.name}
                  </span>
                );
                return p.url ? (
                  <a
                    key={p.name}
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={p.name}
                  >
                    {inner}
                  </a>
                ) : (
                  <span key={p.name}>{inner}</span>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Deux colonnes CTA mises en avant (§1.4). */}
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            marginBottom: 40,
          }}
        >
          <Link
            href="/formations"
            className="card"
            style={{
              padding: 24,
              background: 'oklch(28% 0.04 258)',
              border: '1px solid oklch(35% 0.04 258)',
              color: 'white',
              textDecoration: 'none',
            }}
          >
            <div className="fs-13" style={{ color: 'oklch(75% 0.05 60)', marginBottom: 6 }}>
              {tFooter('joinUs')}
            </div>
            <div className="serif" style={{ fontSize: 26, lineHeight: 1.1, marginBottom: 8 }}>
              {tFooter('joinUs')} →
            </div>
            <div className="fs-14" style={{ color: 'oklch(80% 0.01 80)' }}>
              {tFooter('joinUsDesc')}
            </div>
          </Link>
          <Link
            href="/contact"
            className="card"
            style={{
              padding: 24,
              background: 'oklch(28% 0.04 258)',
              border: '1px solid oklch(35% 0.04 258)',
              color: 'white',
              textDecoration: 'none',
            }}
          >
            <div className="fs-13" style={{ color: 'oklch(75% 0.05 60)', marginBottom: 6 }}>
              {tFooter('askQuestions')}
            </div>
            <div className="serif" style={{ fontSize: 26, lineHeight: 1.1, marginBottom: 8 }}>
              {tFooter('askQuestions')} →
            </div>
            <div className="fs-14" style={{ color: 'oklch(80% 0.01 80)' }}>
              {tFooter('askQuestionsDesc')}
            </div>
          </Link>
        </div>

        <div className="footer-grid">
          <div>
            <div className="row gap-3" style={{ alignItems: 'center', marginBottom: 16 }}>
              <LogoMark size={42} />
              <div className="brand-text">
                <span className="brand-name" style={{ color: 'white' }}>
                  {t('appName')}
                </span>
                <span className="brand-tag" style={{ color: 'oklch(70% 0.02 258)' }}>
                  Dakar · Sénégal
                </span>
              </div>
            </div>
            <p
              className="fs-14"
              style={{ color: 'oklch(80% 0.01 80)', lineHeight: 1.5, maxWidth: 320 }}
            >
              {tFooter('tagline')}
            </p>
          </div>

          <div>
            <h5>{tFooter('programs')}</h5>
            <ul>
              <li>
                <Link href="/formations">{tFooter('diplomas')}</Link>
              </li>
              <li>
                <Link href="/formations">{tFooter('certifications')}</Link>
              </li>
              <li>
                <Link href="/seminaires">{tFooter('seminarsLong')}</Link>
              </li>
              <li>
                <Link href="/concours">{tFooter('entryExams')}</Link>
              </li>
              <li>
                <Link href="/formations">{tFooter('customCourses')}</Link>
              </li>
            </ul>
          </div>

          <div>
            <h5>{tFooter('resources')}</h5>
            <ul>
              <li>
                <Link href="/bibliotheque">{tFooter('library')}</Link>
              </li>
              <li>
                <Link href="/blog">{tFooter('publications')}</Link>
              </li>
              <li>
                <Link href="/blog">{tFooter('regulatoryWatch')}</Link>
              </li>
              <li>
                <Link href="/a-propos">{tFooter('alumni')}</Link>
              </li>
              <li>
                <Link href="/me">{tFooter('memberArea')}</Link>
              </li>
            </ul>
          </div>

          <div>
            <h5>{tFooter('contact')}</h5>
            <ul>
              {contact.address1 ? <li>{contact.address1}</li> : null}
              {contact.address2 ? <li>{contact.address2}</li> : null}
              {contact.phone ? <li>{contact.phone}</li> : null}
              {contact.email ? <li>{contact.email}</li> : null}
            </ul>
            {socialEntries.length > 0 ? (
              <div className="row gap-2" style={{ marginTop: 12, flexWrap: 'wrap' }}>
                {socialEntries.map((s) => (
                  <a
                    key={s.key}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    className="pill"
                    style={{
                      borderColor: 'oklch(35% 0.04 258)',
                      color: 'oklch(85% 0.01 80)',
                      fontSize: 11,
                    }}
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            ) : null}
            <div style={{ marginTop: 16 }}>
              <LocaleSwitcher />
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>{tFooter('copyright')}</span>
          <span>{tFooter('designedIn')}</span>
        </div>
      </div>
    </footer>
  );
}
