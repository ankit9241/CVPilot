import { env } from './env';

export const appConfig = {
  name: env.appName,
  port: env.port,
  apiPrefix: env.apiPrefix,
  corsOrigin: env.cors.origin.split(',').map((s) => s.trim()),
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 300,
  },
  bodyLimit: '5mb',
};
