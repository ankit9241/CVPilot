import type { Request, Response } from 'express';
import { BaseController } from '../../common/base.controller';
import { asyncHandler } from '../../utils/async-handler';
import { profileImportService } from './profile-import.service';
import { BadRequestError, UnauthorizedError } from '../../utils/errors';

export class ProfileImportController extends BaseController {
  /**
   * Endpoint to upload a file (PDF/DOCX) and parse it using LLM.
   */
  importFile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) {
      throw new UnauthorizedError('Unauthorized');
    }

    const file = req.file;
    if (!file) {
      throw new BadRequestError('No file uploaded.');
    }

    const importerType = req.body.importerType;
    if (importerType !== 'resume' && importerType !== 'linkedin') {
      throw new BadRequestError('Invalid importerType. Must be "resume" or "linkedin".');
    }

    let parsed: any;
    try {
      parsed = await profileImportService.parseImportFile(
        file.buffer,
        file.mimetype,
        importerType,
        file.originalname,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error during file parsing';
      console.error('[ProfileImport] parse error:', msg);
      throw new BadRequestError(msg);
    }

    return this.sendOk(res, parsed);
  });

  /**
   * Endpoint to merge reviewed data into the Master Profile.
   */
  mergeProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) {
      throw new UnauthorizedError('Unauthorized');
    }

    try {
      const result = await profileImportService.mergeProfile(req.user.sub, req.body);
      return this.sendOk(res, result);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Prisma Error in mergeProfile:', err);
      throw err;
    }
  });
}

export const profileImportController = new ProfileImportController();
