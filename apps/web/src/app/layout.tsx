import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { TrpcProvider } from '@/components/providers/trpc-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'CPFA — Centre Professionnel de Formation à l’Assurance',
  description: 'Formations, séminaires, concours et bibliothèque spécialisés en assurance.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <TrpcProvider>{children}</TrpcProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
