import { env } from './env';

export const isOriginAllowed = (origin?: string): boolean => {
  if (!origin) return true; // Allow non-browser / server-to-server / mobile requests

  const configuredOrigins = env.cors.origin
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const cleanOrigin = origin.replace(/\/+$/, '');

  // Exact match or wildcard
  if (configuredOrigins.includes(cleanOrigin) || configuredOrigins.includes('*')) {
    return true;
  }

  // Netlify domains (production, branch deploys, preview builds)
  if (/^https:\/\/([a-zA-Z0-9_-]+\.)*netlify\.app$/i.test(cleanOrigin)) {
    return true;
  }

  // Vercel domains (production, preview builds)
  if (/^https:\/\/([a-zA-Z0-9_-]+\.)*vercel\.app$/i.test(cleanOrigin)) {
    return true;
  }

  // Render domains
  if (/^https:\/\/([a-zA-Z0-9_-]+\.)*onrender\.com$/i.test(cleanOrigin)) {
    return true;
  }

  // Localhost and 127.0.0.1 on any port (http / https)
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(cleanOrigin)) {
    return true;
  }

  return false;
};

export const appConfig = {
  name: env.appName,
  port: env.port,
  apiPrefix: env.apiPrefix,
  corsOrigin: env.cors.origin.split(',').map((s) => s.trim()),
  isOriginAllowed,
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 300,
  },
  bodyLimit: '5mb',
};

