import path from 'path';

export const getExtension = (filename: string): string => path.extname(filename).toLowerCase();

export const safeFileName = (name: string): string =>
  name.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 128);

export const isAllowedMime = (mime: string, allowed: readonly string[]): boolean =>
  allowed.includes(mime);
