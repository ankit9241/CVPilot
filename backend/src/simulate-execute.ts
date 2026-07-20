import { prisma } from './prisma/client';
import { generationSessionService } from './modules/workflow/generation-session.service';
import { initializeAIModule } from './ai/init';

async function main() {
  initializeAIModule();

  const sessionId = '0929f64a-20d2-48bc-8623-e9f7f0122a5f';
  
  // Reset session status in database to avoid concurrent request reject
  const session = await (prisma as any).generationSession.update({
    where: { id: sessionId },
    data: { status: 'QUEUED', startedAt: null },
  });

  const userId = session.userId;
  console.log('Simulating execution of session:', sessionId, 'for user:', userId);
  try {
    const result = await generationSessionService.execute(sessionId, userId);
    console.log('Execution succeeded! Result:', result);
  } catch (err: any) {
    console.error('Execution crashed with error:');
    console.error(err);
  }
}
main();
