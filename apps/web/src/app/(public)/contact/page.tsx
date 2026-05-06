import { ContactForm } from '@/components/marketing/contact-form';

export const metadata = { title: 'Contact — CPFA' };

export default function ContactPage() {
  return (
    <section className="container grid gap-12 py-16 md:grid-cols-2">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Contactez-nous</h1>
        <p className="mt-4 text-muted-foreground">
          Pour toute question sur nos formations, séminaires, concours ou la bibliothèque,
          remplissez ce formulaire — nous revenons vers vous sous 48 h ouvrées.
        </p>
        <dl className="mt-8 space-y-4 text-sm">
          <div>
            <dt className="font-semibold">Adresse</dt>
            <dd className="text-muted-foreground">CPFA — Dakar, Sénégal</dd>
          </div>
          <div>
            <dt className="font-semibold">Email</dt>
            <dd className="text-muted-foreground">contact@cpfa.sn</dd>
          </div>
          <div>
            <dt className="font-semibold">Horaires</dt>
            <dd className="text-muted-foreground">Lundi — Vendredi · 8h30 — 17h30</dd>
          </div>
        </dl>
      </div>
      <ContactForm />
    </section>
  );
}
