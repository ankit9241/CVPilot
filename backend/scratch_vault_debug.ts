import { prisma } from './src/prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
  const db = prisma as any;

  // 1. Check what user exists
  const user = await db.user.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!user) { console.log('No user found'); return; }
  console.log('User:', user.id, user.email);

  // 2. Check completed sessions
  const sessions = await db.generationSession.findMany({
    where: { userId: user.id, status: 'COMPLETED' },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    include: {
      versions: {
        orderBy: { versionNo: 'asc' },
        include: {
          atsRuns: { orderBy: { iterationNumber: 'desc' }, take: 1 },
          savedResumes: {
            where: { vault: { userId: user.id }, deletedAt: null },
            take: 1,
          },
        },
      },
    },
  });

  console.log(`\nCompleted sessions: ${sessions.length}`);
  for (const s of sessions) {
    console.log(`\n  Session: ${s.id}`);
    console.log(`    company: ${s.companyName}, role: ${s.targetRole}, status: ${s.status}`);
    console.log(`    versions: ${s.versions.length}`);
    for (const v of s.versions) {
      console.log(`    Version ${v.versionNo}: id=${v.id}, pdfUrl=${v.pdfUrl ? 'YES (' + v.pdfUrl.slice(0,30) + '...)' : 'NULL'}, latexCode=${v.latexCode ? 'YES' : 'NULL'}`);
      console.log(`      savedResumes: ${v.savedResumes.length > 0 ? v.savedResumes[0].id : 'none'}`);
    }
  }

  // 3. Check saved resumes
  const saved = await db.savedResume.findMany({
    where: { vault: { userId: user.id }, deletedAt: null },
    take: 5,
    include: { version: true },
  });
  console.log(`\nSavedResumes: ${saved.length}`);
  for (const sr of saved) {
    console.log(`  SavedResume: ${sr.id} title="${sr.title}" versionId=${sr.versionId} pdfUrl=${sr.version?.pdfUrl ? 'YES' : 'NULL'}`);
  }
}

run().catch(console.error);
