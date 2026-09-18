import { PrismaClient } from '@prisma/client';
import { seedRoles } from './roles';
import { seedCategories } from './categories';
import { seedLocations } from './locations';
import { seedSettings } from './settings';

const db = new PrismaClient();

async function main() {
  console.log('Seeding roles...');
  await seedRoles(db);

  console.log('Seeding categories...');
  await seedCategories(db);

  console.log('Seeding locations...');
  await seedLocations(db);

  console.log('Seeding platform settings...');
  await seedSettings(db);

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());