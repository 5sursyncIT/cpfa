import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // typedRoutes: re-enable once all S2-S5 routes exist (formations, séminaires, bibliothèque, concours, me, mentions-legales)
  typedRoutes: false,
  transpilePackages: ['@cpfa/ui', '@cpfa/emails', '@cpfa/pdf', '@cpfa/lib', '@cpfa/db'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default withNextIntl(config);
