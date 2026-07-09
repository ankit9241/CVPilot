import { env } from './env';

export const databaseConfig = {
  url: env.database.url,
  logQueries: env.isDev,
};
