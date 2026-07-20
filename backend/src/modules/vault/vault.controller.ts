import type { Request, Response } from 'express';
import { BaseController } from '../../common/base.controller';
import { asyncHandler } from '../../utils/async-handler';
import { vaultService, VaultService } from './vault.service';
import { UnauthorizedError } from '../../utils/errors';

export class VaultController extends BaseController {
  constructor(protected readonly service: VaultService = vaultService) {
    super();
  }

  get = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    return this.sendOk(res, await this.service.getVault(req.user.sub));
  });
}

export const vaultController = new VaultController();
