import type { Request, Response } from 'express';
import { BaseController } from '../../common/base.controller';
import { asyncHandler } from '../../utils/async-handler';
import { BadRequestError, UnauthorizedError } from '../../utils/errors';
import { resumeAnalyzerService } from './resume-analyzer.service';

export class ResumeAnalyzerController extends BaseController {
  analyze = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) {
      throw new UnauthorizedError('Unauthorized');
    }

    const file = req.file;
    if (!file || !file.buffer) {
      throw new BadRequestError('resumeFile is required');
    }

    const mime = file.mimetype || '';
    const name = (file.originalname || '').toLowerCase();
    const isPdf = mime.includes('pdf') || name.endsWith('.pdf');
    const isDoc = mime.includes('officedocument.wordprocessingml')
      || mime.includes('msword')
      || name.endsWith('.docx')
      || name.endsWith('.doc');

    if (!isPdf && !isDoc) {
      throw new BadRequestError('Unsupported file type. Upload a PDF or DOCX resume.');
    }

    const jobDescription = req.body?.jobDescription as string | undefined;
    const result = await resumeAnalyzerService.analyze(file.buffer, mime, file.originalname, jobDescription);
    return this.sendCreated(res, result);
  });

  analyzeStream = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) {
      throw new UnauthorizedError('Unauthorized');
    }

    const file = req.file;
    if (!file || !file.buffer) {
      throw new BadRequestError('resumeFile is required');
    }

    const mime = file.mimetype || '';
    const name = (file.originalname || '').toLowerCase();
    const isPdf = mime.includes('pdf') || name.endsWith('.pdf');
    const isDoc = mime.includes('officedocument.wordprocessingml')
      || mime.includes('msword')
      || name.endsWith('.docx')
      || name.endsWith('.doc');

    if (!isPdf && !isDoc) {
      throw new BadRequestError('Unsupported file type. Upload a PDF or DOCX resume.');
    }

    const jobDescription = req.body?.jobDescription as string | undefined;

    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const writeEvent = (event: any) => {
      res.write(JSON.stringify(event) + '\n');
    };

    try {
      await resumeAnalyzerService.analyzeStream(
        file.buffer,
        mime,
        file.originalname,
        jobDescription,
        (evt) => writeEvent(evt),
      );
    } catch (err: any) {
      writeEvent({ type: 'error', error: err?.message || 'Failed to analyze resume' });
    } finally {
      res.end();
    }
  });
}

export const resumeAnalyzerController = new ResumeAnalyzerController();
