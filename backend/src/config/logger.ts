import { env } from './env';

export const loggerConfig = {
  level: env.log.level,
  pretty: env.isDev,
};
