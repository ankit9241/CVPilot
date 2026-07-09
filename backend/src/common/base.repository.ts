import type { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../prisma/client';

/**
 * Thin base repository. Concrete repositories extend this and expose
 * model-specific queries. `TDelegate` is typed as `any` intentionally – the
 * base only carries the delegate reference; each subclass reintroduces the
 * proper Prisma-generated types on its own methods.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class BaseRepository<TDelegate = any> {
  constructor(
    protected readonly delegate: TDelegate,
    protected readonly client: PrismaClient = defaultPrisma,
  ) {}
}
