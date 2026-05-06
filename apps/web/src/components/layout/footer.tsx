import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

const footerColumns = [
  {
    title: 'Institution',
    links: [
      { label: 'À propos', href: '/a-propos' },
      { label: 'Mot du Directeur', href: '/mot-du-directeur' },
      { label: 'Partenaires', href: '/partenaires' },
    ],
  },
  {
    title: 'Activités',
    links: [
      { label: 'Formations', href: '/formations' },
      { label: 'Séminaires', href: '/seminaires' },
      { label: 'Concours', href: '/concours' },
      { label: 'Bibliothèque', href: '/bibliotheque' },
    ],
  },
  {
    title: 'Ressources',
    links: [
      { label: 'Actualités', href: '/blog' },
      { label: 'Contact', href: '/contact' },
      { label: 'Mentions légales', href: '/mentions-legales' },
    ],
  },
];

export async function Footer() {
  const c = await getTranslations('common');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30">
      <div className="container grid gap-8 py-12 md:grid-cols-4">
        <div>
          <p className="text-lg font-bold">{c('appName')}</p>
          <p className="mt-2 text-sm text-muted-foreground">{c('tagline')}</p>
        </div>
        {footerColumns.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-semibold">{col.title}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <div className="container flex flex-col items-center justify-between gap-2 py-4 text-xs text-muted-foreground md:flex-row">
          <p>© {year} CPFA — Centre Professionnel de Formation à l’Assurance.</p>
          <p>Dakar, Sénégal.</p>
        </div>
      </div>
    </footer>
  );
}
