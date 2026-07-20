import { prisma } from './prisma/client';

async function main() {
  const session = await (prisma as any).generationSession.findFirst({
    where: { status: 'FAILED' },
    orderBy: { createdAt: 'desc' },
    include: {
      workflowLogs: { orderBy: { timestamp: 'asc' } },
      aiMessages: { orderBy: { timestamp: 'asc' } },
    }
  });

  if (!session) {
    console.log('No failed session found');
    return;
  }

  console.log('Session ID:', session.id);
  console.log('Session Status:', session.status);
  console.log('Session Error:', session.errorMessage);

  const lastLog = session.workflowLogs[session.workflowLogs.length - 1];
  console.log('Last Log:', lastLog ? `${lastLog.stepName}: ${lastLog.message}` : 'None');

  // Let's print the entire raw text of the logs or check where the parse error is.
  console.log('--- Workflow Logs Details ---');
  for (const log of session.workflowLogs) {
    if (log.errorMessage && log.errorMessage.includes('parse JSON')) {
      console.log(`Log Step: ${log.stepName}`);
      console.log(`Log Message: ${log.message}`);
      console.log(`Log Error: ${log.errorMessage}`);
    }
  }
}
main();
