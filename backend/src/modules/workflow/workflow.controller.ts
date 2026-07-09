import type { Request, Response } from 'express';
import { BaseController } from '../../common/base.controller';
import { asyncHandler } from '../../utils/async-handler';
import { workflowService, WorkflowService } from './workflow.service';

export class WorkflowController extends BaseController {
  constructor(protected readonly service: WorkflowService = workflowService) {
    super();
  }

  list = asyncHandler(async (_req: Request, res: Response) => {
    return this.sendOk(res, this.service.list());
  });

  get = asyncHandler(async (req: Request, res: Response) => {
    return this.sendOk(res, this.service.get(req.params.id));
  });

  logs = asyncHandler(async (req: Request, res: Response) => {
    return this.sendOk(res, this.service.logs(req.params.id));
  });

  start = asyncHandler(async (req: Request, res: Response) => {
    return this.sendCreated(res, this.service.start(req.body));
  });

  cancel = asyncHandler(async (req: Request, res: Response) => {
    this.service.cancel(req.params.id);
    return this.sendNoContent(res);
  });
}

export const workflowController = new WorkflowController();
