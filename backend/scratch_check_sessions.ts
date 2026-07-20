import { prisma } from './src/prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
  console.log('Querying database for latest 3 sessions...');

  const sessions = await prisma.generationSession.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 3,
    include: {
      workflowLogs: {
        where: { errorMessage: { not: null } },
      },
    },
  });

  for (const session of sessions) {
    console.log('\n====================================');
    console.log('Session ID:', session.id);
    console.log('Status:', session.status);
    console.log('Company:', session.companyName);
    console.log('Role:', session.targetRole);
    console.log('ErrorMessage:', session.errorMessage);
    console.log('Updated At:', session.updatedAt.toISOString());
    console.log('Workflow Logs Count:', session.workflowLogs.length);
    for (const log of session.workflowLogs) {
      console.log(`  - Node: ${log.nodeName || log.stepName}`);
      console.log(`    Msg: ${log.message}`);
      console.log(`    Err: ${log.errorMessage}`);
    }
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
