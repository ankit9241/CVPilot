import { createHash, randomUUID } from 'crypto';
import path from 'path';
import { appConfig } from '../config/app';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors';
import { safeFileName } from '../utils/file';
import { deleteObject, presignGetUrl, presignPutUrl, uploadObject } from './s3';
import { storageRepository } from './storage.repository';
import { STORAGE_FOLDERS, STORAGE_RULES, type StorageFileType } from './storage.types';
import {
  type StorageCompleteInput,
  type StoragePresignInput,
  type StorageUploadInput,
} from './storage.dto';

const buildPublicUrl = (id: string) => `${appConfig.apiPrefix}/storage/${id}/url`;

const buildStorageKey = (fileType: StorageFileType, userId: string, originalName: string) => {
  const folder = STORAGE_FOLDERS[fileType];
  const safeName = safeFileName(path.parse(originalName).name) || 'file';
  const extension = safeFileName(path.extname(originalName))
    .replace(/[^a-zA-Z0-9.]/g, '')
    .toLowerCase();
  const nonce = randomUUID();
  return `${folder}/${userId}/${Date.now()}-${nonce}-${safeName}${extension}`;
};

const checksumBuffer = (buffer: Buffer) => createHash('sha256').update(buffer).digest('hex');

const assertUploadRules = (fileType: StorageFileType, mimeType: string, size: number) => {
  const rules = STORAGE_RULES[fileType];
  if (size <= 0) throw new BadRequestError('File is empty');
  if (size > rules.maxBytes)
    throw new BadRequestError(
      `File exceeds the ${Math.round(rules.maxBytes / 1024 / 1024)}MB limit`,
    );
  if (!rules.mimeTypes.includes(mimeType)) {
    throw new BadRequestError(
      `Unsupported MIME type for ${fileType.toLowerCase().replace(/_/g, ' ')}`,
    );
  }
};

const removeKeyIfExists = async (storageKey?: string | null) => {
  if (!storageKey) return;
  try {
    await deleteObject(storageKey);
  } catch {
    // best-effort cleanup
  }
};

export class StorageService {
  async list(userId: string, fileType?: StorageFileType) {
    const records = await storageRepository.list(userId, fileType);
    return Promise.all(
      records.map(async (record) => ({
        ...record,
        downloadUrl: await presignGetUrl(record.storageKey),
      })),
    );
  }

  async get(userId: string, id: string) {
    const record = await storageRepository.findById(userId, id);
    if (!record) throw new NotFoundError('File not found');
    return {
      ...record,
      downloadUrl: await presignGetUrl(record.storageKey),
    };
  }

  async presignUpload(userId: string, input: StoragePresignInput) {
    assertUploadRules(input.fileType, input.mimeType, input.size);

    const duplicate = await storageRepository.findDuplicate(
      userId,
      input.fileType,
      input.checksum,
      { originalName: input.originalName, mimeType: input.mimeType, size: input.size },
    );
    if (duplicate) {
      throw new ConflictError('An identical file already exists');
    }

    const storageKey =
      input.storageKey || buildStorageKey(input.fileType, userId, input.originalName);
    const uploadUrl = await presignPutUrl({ key: storageKey, contentType: input.mimeType });

    return {
      storageKey,
      uploadUrl,
      method: 'PUT' as const,
      headers: { 'Content-Type': input.mimeType },
    };
  }

  async completeUpload(userId: string, input: StorageCompleteInput) {
    assertUploadRules(input.fileType, input.mimeType, input.size);

    const duplicate = await storageRepository.findDuplicate(
      userId,
      input.fileType,
      input.checksum,
      { originalName: input.originalName, mimeType: input.mimeType, size: input.size },
    );
    if (duplicate) {
      await removeKeyIfExists(input.storageKey);
      throw new ConflictError('An identical file already exists');
    }

    const existing = await storageRepository.findByStorageKey(input.storageKey);
    if (existing) {
      await removeKeyIfExists(input.storageKey);
      throw new ConflictError('Storage key already exists');
    }

    const replacement = input.replaceFileId
      ? await storageRepository.findById(userId, input.replaceFileId)
      : null;

    const recordId = randomUUID();
    const record = await storageRepository.create({
      id: recordId,
      userId,
      fileType: input.fileType,
      originalName: input.originalName,
      storageKey: input.storageKey,
      publicUrl: buildPublicUrl(recordId),
      mimeType: input.mimeType,
      size: input.size,
      checksum: input.checksum ?? null,
      createdAt: new Date(),
    });

    if (replacement) {
      await storageRepository.softDelete(replacement.id);
      await removeKeyIfExists(replacement.storageKey);
    }

    return {
      ...record,
      downloadUrl: await presignGetUrl(record.storageKey),
    };
  }

  async upload(userId: string, input: StorageUploadInput, file: Express.Multer.File) {
    if (!file) throw new BadRequestError('File is required');
    assertUploadRules(input.fileType, file.mimetype, file.size);

    const checksum = checksumBuffer(file.buffer);
    const duplicate = await storageRepository.findDuplicate(userId, input.fileType, checksum, {
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });
    if (duplicate) {
      throw new ConflictError('An identical file already exists');
    }

    const storageKey = buildStorageKey(input.fileType, userId, file.originalname);
    await uploadObject(storageKey, file.buffer, file.mimetype);

    const replacement = input.replaceFileId
      ? await storageRepository.findById(userId, input.replaceFileId)
      : null;
    try {
      const recordId = randomUUID();
      const record = await storageRepository.create({
        id: recordId,
        userId,
        fileType: input.fileType,
        originalName: file.originalname,
        storageKey,
        publicUrl: buildPublicUrl(recordId),
        mimeType: file.mimetype,
        size: file.size,
        checksum,
        createdAt: new Date(),
      });

      if (replacement) {
        await storageRepository.softDelete(replacement.id);
        await removeKeyIfExists(replacement.storageKey);
      }

      return {
        ...record,
        downloadUrl: await presignGetUrl(record.storageKey),
      };
    } catch (error) {
      await removeKeyIfExists(storageKey);
      throw error;
    }
  }

  async replace(
    userId: string,
    fileId: string,
    input: StorageUploadInput,
    file: Express.Multer.File,
  ) {
    const existing = await storageRepository.findById(userId, fileId);
    if (!existing) throw new NotFoundError('File not found');
    return this.upload(
      userId,
      { ...input, replaceFileId: fileId, fileType: input.fileType || existing.fileType },
      file,
    );
  }

  async remove(userId: string, id: string) {
    const record = await storageRepository.findById(userId, id);
    if (!record) throw new NotFoundError('File not found');

    await removeKeyIfExists(record.storageKey);
    await storageRepository.softDelete(id);
    return { success: true };
  }

  async getUrl(userId: string, id: string) {
    const record = await storageRepository.findById(userId, id);
    if (!record) throw new NotFoundError('File not found');
    return { id, url: await presignGetUrl(record.storageKey) };
  }
}

export const storageService = new StorageService();
