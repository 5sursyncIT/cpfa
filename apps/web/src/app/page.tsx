import { useTranslations } from 'next-intl';
import { Button } from '@cpfa/ui';

export default function HomePage() {
  const t = useTranslations('home');
  const c = useTranslations('common');

  return (
    <main className="container mx-auto flex min-h-screen flex-col justify-center gap-6 py-16">
      <p className="text-sm uppercase tracking-widest text-muted-foreground">{c('appName')} — {c('tagline')}</p>
      <h1 className="text-4xl font-bold tracking-tight md:text-6xl">{t('heroTitle')}</h1>
      <p className="max-w-2xl text-lg text-muted-foreground">{t('heroSubtitle')}</p>
      <div className="flex gap-3">
        <Button>{t('ctaCatalog')}</Button>
        <Button variant="outline">{t('ctaLibrary')}</Button>
      </div>
    </main>
  );
}
