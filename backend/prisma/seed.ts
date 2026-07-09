import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed placeholder – add template rows, demo users, etc.
  // Kept intentionally empty: no business logic in this pass.
  // eslint-disable-next-line no-console
  console.log('Seed script ready. Add fixtures here.');
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
