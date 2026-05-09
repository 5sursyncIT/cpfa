import Link from 'next/link';
import { LogoMark } from './logo-mark';

export function CpfaFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="row gap-3" style={{ alignItems: 'center', marginBottom: 16 }}>
              <LogoMark size={42} />
              <div className="brand-text">
                <span className="brand-name" style={{ color: 'white' }}>
                  CPFA
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
              Premier centre de référence au Sénégal en matière de formation dans les métiers de
              l&apos;assurance.
            </p>
          </div>

          <div>
            <h5>Programmes</h5>
            <ul>
              <li>
                <Link href="/formations">Cursus diplômants</Link>
              </li>
              <li>
                <Link href="/formations">Certifications professionnelles</Link>
              </li>
              <li>
                <Link href="/seminaires">Séminaires &amp; masterclass</Link>
              </li>
              <li>
                <Link href="/concours">Concours d&apos;entrée</Link>
              </li>
              <li>
                <Link href="/formations">Formations sur mesure</Link>
              </li>
            </ul>
          </div>

          <div>
            <h5>Ressources</h5>
            <ul>
              <li>
                <Link href="/bibliotheque">Bibliothèque</Link>
              </li>
              <li>
                <Link href="/blog">Publications &amp; études</Link>
              </li>
              <li>
                <Link href="/blog">Veille réglementaire</Link>
              </li>
              <li>
                <Link href="/a-propos">Annuaire alumni</Link>
              </li>
              <li>
                <Link href="/me">Espace abonné</Link>
              </li>
            </ul>
          </div>

          <div>
            <h5>Contact</h5>
            <ul>
              <li>Sicap Sacré-Cœur 3</li>
              <li>BP 3308 — Dakar, Sénégal</li>
              <li>+221 33 824 00 00</li>
              <li>contact@cpfa.sn</li>
            </ul>
            <div className="row gap-2" style={{ marginTop: 16 }}>
              <span
                className="pill"
                style={{ borderColor: 'oklch(35% 0.04 258)', color: 'oklch(80% 0.01 80)' }}
              >
                FR
              </span>
              <span
                className="pill"
                style={{ borderColor: 'oklch(35% 0.04 258)', color: 'oklch(60% 0.02 258)' }}
              >
                EN
              </span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 CPFA · Agréé par le Ministère des Finances</span>
          <span>Conçu à Dakar · Fait en orbite</span>
        </div>
      </div>
    </footer>
  );
}
