import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const users = [
  {
    email: 'thabo.mokoena@example.com', firstName: 'Thabo', lastName: 'Mokoena' 
  },
  {
    email: 'amahle.dlamini@example.com', firstName: 'Amahle', lastName: 'Dlamini' 
  },
  {
    email: 'sipho.nkosi@example.com', firstName: 'Sipho', lastName: 'Nkosi' 
  }
];

async function main(): Promise<void> {
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
