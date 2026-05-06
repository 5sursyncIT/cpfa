import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@cpfa/ui';

export function Hero() {
  const t = useTranslations('home');

  return (
    <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 to-transparent">
      <div className="container flex flex-col items-start gap-6 py-20 md:py-28">
        <span className="rounded-full border bg-background/60 px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
          Centre Professionnel de Formation à l’Assurance
        </span>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          {t('heroTitle')}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">{t('heroSubtitle')}</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/formations">{t('ctaCatalog')}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/bibliotheque">{t('ctaLibrary')}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
