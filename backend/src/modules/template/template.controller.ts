import type { Request, Response } from 'express';
import { BaseController } from '../../common/base.controller';
import { asyncHandler } from '../../utils/async-handler';
import { templateService, TemplateService } from './template.service';

export class TemplateController extends BaseController {
  constructor(protected readonly service: TemplateService = templateService) {
    super();
  }

  list = asyncHandler(async (req: Request, res: Response) => {
    return this.sendOk(res, this.service.list(req.query as { category?: string; isPremium?: boolean }));
  });

  get = asyncHandler(async (req: Request, res: Response) => {
    return this.sendOk(res, this.service.get(req.params.id));
  });
}

export const templateController = new TemplateController();
