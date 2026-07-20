import { prisma } from './src/prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
  const sessionId = 'c6fb91de-a93a-4d46-9a50-e6497c8efd81';
  console.log('Querying versions and their PDF status for session:', sessionId);

  const versions = await prisma.resumeVersion.findMany({
    where: { sessionId },
    orderBy: { versionNo: 'asc' },
  });

  for (const v of versions) {
    console.log(`Version ${v.versionNo}:`);
    console.log(`  ID: ${v.id}`);
    console.log(`  pdfUrl: ${v.pdfUrl}`);
    console.log(`  hasLatexCode: ${!!v.latexCode}`);
    if (v.latexCode) {
      console.log(`  latexCode preview: ${v.latexCode.slice(0, 100)}...`);
    }
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
