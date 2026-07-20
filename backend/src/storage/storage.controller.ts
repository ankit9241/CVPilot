import type { Request, Response } from 'express';
import { BaseController } from '../common/base.controller';
import { asyncHandler } from '../utils/async-handler';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import { storageService, StorageService } from './storage.service';
import {
  storageCompleteSchema,
  storageListQuerySchema,
  storagePresignSchema,
  storageUploadSchema,
} from './storage.dto';

export class StorageController extends BaseController {
  constructor(protected readonly service: StorageService = storageService) {
    super();
  }

  list = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    const parsed = storageListQuerySchema.parse(req.query);
    return this.sendOk(res, await this.service.list(req.user.sub, parsed.fileType));
  });

  presign = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    const parsed = storagePresignSchema.parse(req.body);
    return this.sendOk(res, await this.service.presignUpload(req.user.sub, parsed));
  });

  complete = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    const parsed = storageCompleteSchema.parse(req.body);
    return this.sendCreated(res, await this.service.completeUpload(req.user.sub, parsed));
  });

  upload = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    if (!req.file) throw new BadRequestError('File is required');
    const parsed = storageUploadSchema.parse(req.body);
    return this.sendCreated(res, await this.service.upload(req.user.sub, parsed, req.file));
  });

  replace = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    if (!req.file) throw new BadRequestError('File is required');
    const parsed = storageUploadSchema.parse(req.body);
    return this.sendOk(
      res,
      await this.service.replace(req.user.sub, req.params.id, parsed, req.file),
    );
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    await this.service.remove(req.user.sub, req.params.id);
    return this.sendNoContent(res);
  });

  url = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    return this.sendOk(res, await this.service.getUrl(req.user.sub, req.params.id));
  });
}

export const storageController = new StorageController();
