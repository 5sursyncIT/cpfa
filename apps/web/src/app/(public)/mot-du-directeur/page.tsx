export const metadata = { title: 'Mot du Directeur — CPFA' };

export default function DirectorWordPage() {
  return (
    <article className="container max-w-3xl py-16">
      <h1 className="text-4xl font-bold tracking-tight">Mot du Directeur</h1>
      <p className="mt-2 text-sm uppercase tracking-widest text-muted-foreground">
        Centre Professionnel de Formation à l’Assurance
      </p>
      <div className="prose prose-slate mt-8 max-w-none">
        <p>
          Bienvenue sur la plateforme du CPFA. Notre ambition est de faire émerger une génération
          de professionnels de l’assurance maîtrisant les enjeux techniques, économiques et
          réglementaires d’un secteur en transformation rapide.
        </p>
        <p>
          Que vous soyez étudiant, professionnel en reconversion, ou cadre confirmé, vous trouverez
          ici le parcours adapté à votre projet : formations diplômantes, certifications,
          séminaires d’actualité et accès à notre bibliothèque spécialisée.
        </p>
        <p className="text-right">— La Direction</p>
      </div>
    </article>
  );
}
