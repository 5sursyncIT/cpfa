import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@cpfa.local';

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      firstName: 'Super',
      lastName: 'Admin',
      roles: [Role.SUPER_ADMIN, Role.ADMIN],
      emailVerifiedAt: new Date(),
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Seed complete — admin user: ${adminEmail}`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
