import type { Request, Response } from 'express';
import { BaseController } from '../../common/base.controller';
import { asyncHandler } from '../../utils/async-handler';
import { vaultService, VaultService } from './vault.service';

export class VaultController extends BaseController {
  constructor(protected readonly service: VaultService = vaultService) {
    super();
  }

  get = asyncHandler(async (_req: Request, res: Response) => {
    return this.sendOk(res, this.service.getVault());
  });
}

export const vaultController = new VaultController();
