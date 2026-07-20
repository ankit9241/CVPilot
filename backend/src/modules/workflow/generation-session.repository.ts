import { prisma } from '../../prisma/client';
import { BaseRepository } from '../../common/base.repository';

type GenerationSessionDelegate = typeof prisma.generationSession;
type WorkflowLogDelegate = typeof prisma.workflowLog;
type AIMessageDelegate = typeof prisma.aIMessage;

export class GenerationSessionRepository extends BaseRepository<GenerationSessionDelegate> {
  constructor() {
    super(prisma.generationSession);
  }

  create(userId: string, data: Record<string, unknown>) {
    return this.delegate.create({
      data: {
        userId,
        ...data,
      } as never,
    });
  }

  findById(id: string) {
    return this.delegate.findUnique({
      where: { id },
      include: {
        workflowLogs: { orderBy: { timestamp: 'asc' } },
        aiMessages: { orderBy: { timestamp: 'asc' } },
        atsRuns: { orderBy: { iterationNumber: 'asc' } },
      },
    });
  }

  updateStatus(id: string, status: string, currentStep?: string) {
    return this.delegate.update({
      where: { id },
      data: {
        status: status as never,
        currentStep,
        updatedAt: new Date(),
      },
    });
  }

  updateError(id: string, errorMessage: string) {
    return this.delegate.update({
      where: { id },
      data: {
        status: 'FAILED' as never,
        errorMessage,
        updatedAt: new Date(),
      },
    });
  }

  setCompleted(id: string) {
    return this.delegate.update({
      where: { id },
      data: {
        status: 'COMPLETED' as never,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}

export class WorkflowLogRepository extends BaseRepository<WorkflowLogDelegate> {
  constructor() {
    super(prisma.workflowLog);
  }

  create(sessionId: string, data: Record<string, unknown>) {
    return this.delegate.create({
      data: {
        sessionId,
        ...data,
        timestamp: new Date(),
      } as never,
    });
  }

  findBySessionId(sessionId: string) {
    return this.delegate.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });
  }
}

export class AIMessageRepository extends BaseRepository<AIMessageDelegate> {
  constructor() {
    super(prisma.aIMessage);
  }

  create(sessionId: string, data: Record<string, unknown>) {
    return this.delegate.create({
      data: {
        sessionId,
        ...data,
        timestamp: new Date(),
      } as never,
    });
  }

  findBySessionId(sessionId: string) {
    return this.delegate.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });
  }
}

export const generationSessionRepository = new GenerationSessionRepository();
export const workflowLogRepository = new WorkflowLogRepository();
export const aiMessageRepository = new AIMessageRepository();
