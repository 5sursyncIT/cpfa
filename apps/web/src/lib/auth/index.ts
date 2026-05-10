import NextAuth, { type DefaultSession } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import Nodemailer from 'next-auth/providers/nodemailer';
import argon2 from 'argon2';
import { z } from 'zod';
import { prisma, type Role } from '@cpfa/db';
import { authConfig } from './config';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      roles: Role[];
    } & DefaultSession['user'];
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    ...authConfig.providers,
    // Magic-link email via SMTP (Nodemailer). Falls back gracefully if SMTP_HOST
    // isn't set: the provider stays registered but Auth.js refuses to send.
    Nodemailer({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: Number(process.env.SMTP_PORT ?? 587) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        tls: { rejectUnauthorized: process.env.SMTP_TLS_INSECURE !== 'true' },
      },
      from: process.env.EMAIL_FROM ?? 'CPFA <noreply@cpfa.local>',
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (!user?.passwordHash) return null;

        const ok = await argon2.verify(user.passwordHash, parsed.data.password);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { id: true, roles: true },
        });
        if (dbUser) {
          token.sub = dbUser.id;
          token.roles = dbUser.roles;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      if (Array.isArray(token.roles)) session.user.roles = token.roles as Role[];
      else session.user.roles = [];
      return session;
    },
  },
});

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}
