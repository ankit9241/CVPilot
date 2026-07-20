import type { Request, Response } from 'express';
import { BaseController } from '../../common/base.controller';
import { asyncHandler } from '../../utils/async-handler';
import { applicationService, ApplicationService } from './application.service';

export class ApplicationController extends BaseController {
  constructor(protected readonly service: ApplicationService = applicationService) {
    super();
  }

  list = asyncHandler(async (_req: Request, res: Response) => {
    return this.sendOk(res, this.service.list());
  });

  board = asyncHandler(async (_req: Request, res: Response) => {
    return this.sendOk(res, this.service.board());
  });

  get = asyncHandler(async (req: Request, res: Response) => {
    return this.sendOk(res, this.service.get(req.params.id));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    return this.sendCreated(res, this.service.create(req.body));
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    return this.sendOk(res, this.service.update(req.params.id, req.body));
  });

  updateStatus = asyncHandler(async (req: Request, res: Response) => {
    return this.sendOk(
      res,
      this.service.updateStatus(req.params.id, req.body.status, req.body.note),
    );
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    this.service.remove(req.params.id);
    return this.sendNoContent(res);
  });

  stages = asyncHandler(async (req: Request, res: Response) => {
    return this.sendOk(res, this.service.stages(req.params.id));
  });
}

export const applicationController = new ApplicationController();
