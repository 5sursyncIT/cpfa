// Edge-safe Auth.js config. No DB adapter, no native modules (no argon2).
// Used by Next.js middleware. The full config in `index.ts` extends this.

import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

export const authConfig = {
  pages: { signIn: '/sign-in' },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    authorized({ auth: session, request }) {
      const path = request.nextUrl.pathname;
      const isProtected = path.startsWith('/admin') || path.startsWith('/me');
      if (!isProtected) return true;
      return !!session?.user;
    },
  },
} satisfies NextAuthConfig;
