import type { Request, Response } from 'express';
import { BaseController } from '../../common/base.controller';
import { asyncHandler } from '../../utils/async-handler';
import {
  achievementsService,
  certificatesService,
  educationService,
  experienceService,
  profileService,
  ProfileService,
  projectsService,
  skillsService,
  socialLinksService,
  userService,
  UserService,
} from './profile.service';

const wrap = <S extends {
  list: () => unknown;
  create: (d: Record<string, unknown>) => unknown;
  update: (id: string, d: Record<string, unknown>) => unknown;
  remove: (id: string) => unknown;
}>(svc: S) => ({
  list: asyncHandler(async (_req: Request, res: Response) => ok(res, svc.list())),
  create: asyncHandler(async (req: Request, res: Response) => created(res, svc.create(req.body))),
  update: asyncHandler(async (req: Request, res: Response) =>
    ok(res, svc.update(req.params.id, req.body)),
  ),
  remove: asyncHandler(async (req: Request, res: Response) => {
    svc.remove(req.params.id);
    return noContent(res);
  }),
});

// Helpers to maintain alignment with base controllers
const ok = (res: Response, data: unknown) => res.status(200).json({ success: true, data });
const created = (res: Response, data: unknown) => res.status(201).json({ success: true, data });
const noContent = (res: Response) => res.status(204).end();

export class UserController extends BaseController {
  constructor(protected readonly service: UserService = userService) {
    super();
  }

  me = asyncHandler(async (_req: Request, res: Response) => {
    return this.sendOk(res, this.service.me());
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    return this.sendOk(res, this.service.update(req.body));
  });

  remove = asyncHandler(async (_req: Request, res: Response) => {
    this.service.delete();
    return this.sendNoContent(res);
  });
}

export class ProfileController extends BaseController {
  constructor(protected readonly service: ProfileService = profileService) {
    super();
  }

  get = asyncHandler(async (_req: Request, res: Response) => {
    return this.sendOk(res, this.service.get());
  });

  upsert = asyncHandler(async (req: Request, res: Response) => {
    return this.sendOk(res, this.service.upsert(req.body));
  });

  completion = asyncHandler(async (_req: Request, res: Response) => {
    return this.sendOk(res, this.service.completion());
  });
}

export const userController = new UserController();
export const profileController = new ProfileController();

export const socialLinksController = wrap(socialLinksService);
export const educationController = wrap(educationService);
export const experienceController = wrap(experienceService);
export const projectsController = wrap(projectsService);
export const skillsController = wrap(skillsService);
export const certificatesController = wrap(certificatesService);
export const achievementsController = wrap(achievementsService);
