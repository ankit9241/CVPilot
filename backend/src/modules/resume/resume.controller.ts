import type { Request, Response } from 'express';
import { BaseController } from '../../common/base.controller';
import { asyncHandler } from '../../utils/async-handler';
import { atsService, AtsService, resumeService, ResumeService } from './resume.service';

export class ResumeController extends BaseController {
  constructor(protected readonly service: ResumeService = resumeService) {
    super();
  }

  list = asyncHandler(async (_req: Request, res: Response) => {
    return this.sendOk(res, this.service.list());
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

  remove = asyncHandler(async (req: Request, res: Response) => {
    this.service.remove(req.params.id);
    return this.sendNoContent(res);
  });

  listVersions = asyncHandler(async (req: Request, res: Response) => {
    return this.sendOk(res, this.service.versions(req.params.id));
  });

  createVersion = asyncHandler(async (req: Request, res: Response) => {
    return this.sendCreated(res, this.service.createVersion(req.params.id, req.body));
  });
}

export class AtsController extends BaseController {
  constructor(protected readonly service: AtsService = atsService) {
    super();
  }

  latest = asyncHandler(async (req: Request, res: Response) => {
    return this.sendOk(res, this.service.latest(req.params.resumeId));
  });

  analyze = asyncHandler(async (req: Request, res: Response) => {
    return this.sendCreated(res, this.service.analyze(req.params.resumeId));
  });
}

export const resumeController = new ResumeController();
export const atsController = new AtsController();
