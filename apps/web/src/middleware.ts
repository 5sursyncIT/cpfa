import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/config';

// Edge-safe middleware: uses the lightweight authConfig (no DB adapter, no native modules).
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ['/admin/:path*', '/me/:path*'],
};
