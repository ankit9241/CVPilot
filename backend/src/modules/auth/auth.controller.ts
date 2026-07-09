import type { Request, Response } from 'express';
import { BaseController } from '../../common/base.controller';
import { asyncHandler } from '../../utils/async-handler';
import { authService, AuthService } from './auth.service';

export class AuthController extends BaseController {
  constructor(protected readonly service: AuthService = authService) {
    super();
  }

  register = asyncHandler(async (req: Request, res: Response) => {
    return this.sendCreated(res, this.service.register(req.body));
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    return this.sendOk(res, this.service.login(req.body));
  });

  google = asyncHandler(async (req: Request, res: Response) => {
    return this.sendOk(res, this.service.google(req.body));
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    return this.sendOk(res, this.service.refresh(req.body));
  });

  me = asyncHandler(async (_req: Request, res: Response) => {
    return this.sendOk(res, this.service.me());
  });

  logout = asyncHandler(async (_req: Request, res: Response) => {
    return this.sendOk(res, this.service.logout());
  });
}

export const authController = new AuthController();
