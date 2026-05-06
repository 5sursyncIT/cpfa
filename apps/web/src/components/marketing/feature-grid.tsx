import Link from 'next/link';
import { BookOpen, GraduationCap, Library, Trophy } from 'lucide-react';

const features = [
  {
    href: '/formations',
    icon: GraduationCap,
    title: 'Formations diplômantes',
    description: 'DTA, BTS, certifications professionnelles et formations à la carte adaptées au marché sénégalais.',
  },
  {
    href: '/seminaires',
    icon: BookOpen,
    title: 'Séminaires',
    description: 'Sessions courtes animées par des praticiens du secteur, ouvertes aux professionnels en activité.',
  },
  {
    href: '/bibliotheque',
    icon: Library,
    title: 'Bibliothèque spécialisée',
    description: 'Catalogue d’ouvrages, mémoires et revues. Emprunt 14 jours, carte d’abonné numérique avec QR.',
  },
  {
    href: '/concours',
    icon: Trophy,
    title: 'Concours & examens',
    description: 'Candidatures en ligne, paiement des frais, convocation automatique, banque d’épreuves protégée.',
  },
];

export function FeatureGrid() {
  return (
    <section className="container py-20">
      <div className="mb-10 max-w-2xl">
        <h2 className="text-3xl font-bold tracking-tight">Quatre pôles, une mission</h2>
        <p className="mt-2 text-muted-foreground">
          Former les professionnels de l’assurance et accompagner la profession au Sénégal et en Afrique de l’Ouest.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {features.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-lg border bg-card p-6 transition-all hover:border-foreground/30 hover:shadow-sm"
          >
            <Icon className="size-8 text-primary" aria-hidden />
            <h3 className="mt-4 text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
