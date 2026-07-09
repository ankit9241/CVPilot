import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { ok } from '../utils/response';
import { uploadService } from '../services/upload.service';

export const uploadController = {
  presign: asyncHandler(async (req: Request, res: Response) => ok(res, await uploadService.presign(req.body))),
  download: asyncHandler(async (req: Request, res: Response) =>
    ok(res, await uploadService.download(req.params.key)),
  ),
};
