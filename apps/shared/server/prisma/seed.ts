import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const users = [
  {
    username: 'thabo.m', email: 'thabo.mokoena@example.com', firstName: 'Thabo', lastName: 'Mokoena'
  },
  {
    username: 'amahle.d', email: 'amahle.dlamini@example.com', firstName: 'Amahle', lastName: 'Dlamini'
  },
  {
    username: 'sipho.n', email: 'sipho.nkosi@example.com', firstName: 'Sipho', lastName: 'Nkosi'
  },
  {
    username: 'naledi.k', email: 'naledi.khumalo@example.com', firstName: 'Naledi', lastName: 'Khumalo'
  },
  {
    username: 'johan.v', email: 'johan.vandermerwe@example.com', firstName: 'Johan', lastName: 'van der Merwe'
  }
];

const monoliths = [
  {
    id: 101, name: 'Avalon Monolith A', modelUrl: 'gs://assets/avalon.glb', finalSoilForm: 'Avalon'
  },
  {
    id: 102, name: 'Hutton Monolith A', modelUrl: 'gs://assets/hutton.glb', finalSoilForm: 'Hutton'
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

  for (const monolith of monoliths) {
    await prisma.monolith.upsert({
      where: { id: monolith.id },
      update: {},
      create: monolith
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
