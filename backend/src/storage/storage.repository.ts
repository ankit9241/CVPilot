import { prisma } from '../prisma/client';
import type { Prisma } from '@prisma/client';
import { BaseRepository } from '../common/base.repository';
import type { StorageFileType } from './storage.types';

type StorageDelegate = (typeof prisma)['storageFile'];

export class StorageRepository extends BaseRepository<StorageDelegate> {
  constructor() {
    super(prisma.storageFile);
  }

  list(userId: string, fileType?: StorageFileType) {
    return this.delegate.findMany({
      where: {
        userId,
        ...(fileType ? { fileType } : {}),
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(userId: string, id: string) {
    return this.delegate.findFirst({
      where: { id, userId, deletedAt: null },
    });
  }

  findByStorageKey(storageKey: string) {
    return this.delegate.findUnique({ where: { storageKey } });
  }

  findDuplicate(
    userId: string,
    fileType: StorageFileType,
    checksum?: string,
    fallback?: { originalName: string; mimeType: string; size: number },
  ) {
    if (checksum) {
      return this.delegate.findFirst({
        where: { userId, fileType, checksum, deletedAt: null },
      });
    }

    return this.delegate.findFirst({
      where: {
        userId,
        fileType,
        deletedAt: null,
        ...(fallback ? fallback : {}),
      },
    });
  }

  create(data: Prisma.StorageFileUncheckedCreateInput) {
    return this.delegate.create({ data });
  }

  softDelete(id: string) {
    return this.delegate.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export const storageRepository = new StorageRepository();
