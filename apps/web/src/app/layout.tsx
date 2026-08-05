import type { Metadata } from 'next';
import { Instrument_Serif, Geist, Geist_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { TrpcProvider } from '@/components/providers/trpc-provider';
import './globals.css';

const serif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const sans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CPFA — Centre de Perfectionnement et de Formation en Assurance',
  description:
    "Premier centre de référence au Sénégal pour les métiers de l'assurance, de la réassurance et de l'actuariat. Trente ans à former la zone CIMA.",
  icons: {
    icon: [{ url: '/images/fav.ico', type: 'image/x-icon' }],
    shortcut: '/images/fav.ico',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  // Le skip-link est rendu hors du provider client : on résout son libellé
  // côté serveur plutôt que via `useTranslations`.
  const skipLabel = (await getTranslations('common'))('skipToContent');

  return (
    <html lang={locale} className={`${serif.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <a href="#main-content" className="skip-link">
          {skipLabel}
        </a>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <TrpcProvider>{children}</TrpcProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
