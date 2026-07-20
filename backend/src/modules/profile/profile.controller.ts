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
  reorderSkills,
  skillsService,
  socialLinksService,
  userService,
  UserService,
} from './profile.service';
import { UnauthorizedError } from '../../utils/errors';

const wrap = <
  S extends {
    list: (userId: string) => Promise<unknown>;
    create: (userId: string, d: Record<string, unknown>) => Promise<unknown>;
    update: (userId: string, id: string, d: Record<string, unknown>) => Promise<unknown>;
    remove: (userId: string, id: string) => Promise<unknown>;
  },
>(
  svc: S,
) => ({
  list: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    const result = await svc.list(req.user.sub);
    return ok(res, result);
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    const result = await svc.create(req.user.sub, req.body);
    return created(res, result);
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    const result = await svc.update(req.user.sub, req.params.id, req.body);
    return ok(res, result);
  }),
  remove: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    await svc.remove(req.user.sub, req.params.id);
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

  me = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    return this.sendOk(res, await this.service.me(req.user.sub));
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    return this.sendOk(res, await this.service.update(req.user.sub, req.body));
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    await this.service.delete(req.user.sub);
    return this.sendNoContent(res);
  });
}

export class ProfileController extends BaseController {
  constructor(protected readonly service: ProfileService = profileService) {
    super();
  }

  get = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    return this.sendOk(res, await this.service.get(req.user.sub));
  });

  upsert = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    return this.sendOk(res, await this.service.upsert(req.user.sub, req.body));
  });

  completion = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    return this.sendOk(res, await this.service.completion(req.user.sub));
  });

  reorderSkills = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    await reorderSkills(
      req.user.sub,
      Array.isArray(req.body?.orderedIds) ? req.body.orderedIds : [],
    );
    return this.sendOk(res, { success: true });
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
