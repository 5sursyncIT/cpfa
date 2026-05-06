export const metadata = { title: 'Partenaires — CPFA' };

const partnerCategories = [
  {
    title: 'Compagnies d’assurance',
    items: ['Partenaire 1', 'Partenaire 2', 'Partenaire 3'],
  },
  {
    title: 'Institutions académiques',
    items: ['Partenaire 4', 'Partenaire 5'],
  },
  {
    title: 'Régulateurs et fédérations',
    items: ['Partenaire 6', 'Partenaire 7'],
  },
];

export default function PartnersPage() {
  return (
    <section className="container py-16">
      <h1 className="text-4xl font-bold tracking-tight">Partenaires</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Le CPFA s’appuie sur un réseau de partenaires nationaux et internationaux qui contribuent
        au rayonnement de la formation en assurance.
      </p>
      <div className="mt-10 grid gap-8 md:grid-cols-3">
        {partnerCategories.map((cat) => (
          <div key={cat.title}>
            <h2 className="text-lg font-semibold">{cat.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {cat.items.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
