import type { Request, Response } from 'express';
import { BaseController } from '../../common/base.controller';
import { asyncHandler } from '../../utils/async-handler';
import { generationSessionService } from './generation-session.service';
import {
  generationSessionRepository,
  workflowLogRepository,
} from './generation-session.repository';
import { NotFoundError, UnauthorizedError } from '../../utils/errors';

export class WorkflowController extends BaseController {
  initiate = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) {
      throw new UnauthorizedError('Unauthorized');
    }
    const session = await generationSessionService.initiate(req.user.sub, req.body.input || {});
    return this.sendCreated(res, session);
  });

  getSession = asyncHandler(async (req: Request, res: Response) => {
    const session = await generationSessionRepository.findById(req.params.id);
    if (!session) {
      throw new NotFoundError('Session not found');
    }
    return this.sendOk(res, session);
  });

  getLogs = asyncHandler(async (req: Request, res: Response) => {
    const logs = await workflowLogRepository.findBySessionId(req.params.id);
    return this.sendOk(res, logs);
  });

  execute = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) {
      throw new UnauthorizedError('Unauthorized');
    }
    const result = await generationSessionService.execute(req.params.id, req.user.sub);
    return this.sendOk(res, result);
  });
}

export const workflowController = new WorkflowController();
