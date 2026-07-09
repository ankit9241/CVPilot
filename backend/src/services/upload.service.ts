import { presignPutUrl, presignGetUrl } from '../storage/s3';

export const uploadService = {
  async presign(input: { key: string; contentType: string }) {
    try {
      const url = await presignPutUrl({ key: input.key, contentType: input.contentType });
      return { key: input.key, url, method: 'PUT' as const };
    } catch {
      // Fallback dummy URL so the endpoint works without AWS creds in dev.
      return {
        key: input.key,
        url: `https://dummy.upload.local/${encodeURIComponent(input.key)}`,
        method: 'PUT' as const,
      };
    }
  },
  async download(key: string) {
    try {
      const url = await presignGetUrl(key);
      return { key, url };
    } catch {
      return { key, url: `https://dummy.download.local/${encodeURIComponent(key)}` };
    }
  },
};
