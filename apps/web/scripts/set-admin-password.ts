/**
 * One-shot CLI to set (or reset) a user's password and grant ADMIN roles.
 *
 *   pnpm admin:set-password <email> <password>
 *
 * - Hashes the password with Argon2id (same algo as the Credentials provider).
 * - Upserts the user: creates them with ADMIN + SUPER_ADMIN if missing,
 *   otherwise updates the existing record's passwordHash and ensures the
 *   ADMIN role is present (does NOT downgrade if already SUPER_ADMIN).
 * - Marks email as verified so magic-link flow isn't required.
 *
 * Use only against trusted environments — do not expose this in CI.
 */

import argon2 from 'argon2';
import { prisma, Role } from '@cpfa/db';

async function main() {
  const [, , email, password] = process.argv;

  if (!email || !password) {
    console.error('Usage: pnpm admin:set-password <email> <password>');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Refusing: password must be at least 8 characters.');
    process.exit(1);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Refusing: not a valid email.');
    process.exit(1);
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    const roles = new Set(existing.roles);
    roles.add(Role.ADMIN);
    roles.add(Role.SUPER_ADMIN);
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        roles: Array.from(roles),
        emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
      },
    });
    console.log(`✓ Updated ${email} — password reset, roles: ${Array.from(roles).join(', ')}`);
  } else {
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: 'Admin',
        lastName: '',
        roles: [Role.SUPER_ADMIN, Role.ADMIN],
        emailVerifiedAt: new Date(),
      },
    });
    console.log(`✓ Created ${email} — roles: SUPER_ADMIN, ADMIN`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
