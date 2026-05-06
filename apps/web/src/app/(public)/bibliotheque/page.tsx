import { LibrarySearch } from '@/components/library/library-search';

export const metadata = { title: 'Bibliothèque — CPFA' };

export default function LibraryIndexPage() {
  return (
    <section className="container py-16">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight">Bibliothèque</h1>
        <p className="mt-2 text-muted-foreground">
          Catalogue d’ouvrages, mémoires et revues spécialisés en assurance et gestion des risques.
          L’abonnement annuel donne droit à 3 prêts simultanés et au scan QR à l’accueil.
        </p>
      </header>

      <LibrarySearch />
    </section>
  );
}
