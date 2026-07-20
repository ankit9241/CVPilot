import { prisma } from './src/prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
  const sessionId = 'c6fb91de-a93a-4d46-9a50-e6497c8efd81';
  console.log('Querying ResumeVersion for sessionId:', sessionId);

  const versions = await prisma.resumeVersion.findMany({
    where: { sessionId },
  });

  console.log(`Found ${versions.length} versions:`);
  for (const v of versions) {
    console.log(`  - Version ID: ${v.id}, versionNo: ${v.versionNo}, label: ${v.label}, createdAt: ${v.createdAt.toISOString()}`);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
