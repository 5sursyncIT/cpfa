export const metadata = { title: 'À propos — CPFA' };

export default function AboutPage() {
  return (
    <article className="container max-w-3xl py-16">
      <h1 className="text-4xl font-bold tracking-tight">À propos du CPFA</h1>
      <p className="mt-6 text-lg text-muted-foreground">
        Le Centre Professionnel de Formation à l’Assurance forme les futurs cadres et techniciens du
        secteur de l’assurance au Sénégal et en Afrique de l’Ouest depuis plusieurs décennies.
      </p>
      <div className="prose prose-slate mt-8 max-w-none">
        <h2>Notre mission</h2>
        <p>
          Accompagner la professionnalisation du secteur de l’assurance, à travers des formations
          diplômantes et certifiantes, des séminaires d’actualité, et l’organisation de concours
          ouverts aux étudiants comme aux professionnels en activité.
        </p>
        <h2>Nos pôles</h2>
        <ul>
          <li>Formations diplômantes (DTA, BTS) et certifications</li>
          <li>Séminaires courts animés par des praticiens</li>
          <li>Bibliothèque spécialisée en assurance et risques</li>
          <li>Concours et examens du secteur</li>
        </ul>
      </div>
    </article>
  );
}
