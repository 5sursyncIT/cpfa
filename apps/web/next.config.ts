import type { NextConfig } from 'next';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import createNextIntlPlugin from 'next-intl/plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, '../..');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // typedRoutes: re-enable once all S2-S5 routes exist (formations, séminaires, bibliothèque, concours, me, mentions-legales)
  typedRoutes: false,
  output: 'standalone',
  // pnpm workspaces hoist node_modules above apps/web; without this Next traces
  // an incomplete dependency set into .next/standalone.
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: ['@cpfa/ui', '@cpfa/emails', '@cpfa/pdf', '@cpfa/lib', '@cpfa/db'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default withNextIntl(config);
