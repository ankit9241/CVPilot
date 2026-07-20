import type { Request, Response } from 'express';
import { BaseController } from '../../common/base.controller';
import { asyncHandler } from '../../utils/async-handler';
import { atsService, AtsService, resumeService, ResumeService } from './resume.service';
import { UnauthorizedError } from '../../utils/errors';

export class ResumeController extends BaseController {
  constructor(protected readonly service: ResumeService = resumeService) {
    super();
  }

  getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    return this.sendOk(res, await this.service.getDashboardStats(req.user.sub));
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    return this.sendOk(res, await this.service.list(req.user.sub));
  });

  get = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    return this.sendOk(res, await this.service.get(req.user.sub, req.params.id));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    return this.sendCreated(res, await this.service.create(req.user.sub, req.body));
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    return this.sendOk(res, await this.service.update(req.user.sub, req.params.id, req.body));
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    await this.service.remove(req.user.sub, req.params.id);
    return this.sendNoContent(res);
  });

  listVersions = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    return this.sendOk(res, await this.service.versions(req.user.sub, req.params.id));
  });

  createVersion = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    return this.sendCreated(
      res,
      await this.service.createVersion(req.user.sub, req.params.id, req.body),
    );
  });

  render = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    const { versionId } = req.params;
    const { templateId } = req.body;
    return this.sendOk(res, await this.service.render(req.user.sub, versionId, templateId));
  });
}

export class AtsController extends BaseController {
  constructor(protected readonly service: AtsService = atsService) {
    super();
  }

  latest = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    return this.sendOk(res, await this.service.latest(req.user.sub, req.params.resumeId));
  });

  analyze = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    return this.sendCreated(res, await this.service.analyze(req.user.sub, req.params.resumeId));
  });
}

export const resumeController = new ResumeController();
export const atsController = new AtsController();
