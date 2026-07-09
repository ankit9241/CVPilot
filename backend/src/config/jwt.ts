import { env } from './env';

export const jwtConfig = {
  accessSecret: env.jwt.accessSecret,
  accessExpiresIn: env.jwt.accessExpiresIn,
  refreshSecret: env.jwt.refreshSecret,
  refreshExpiresIn: env.jwt.refreshExpiresIn,
  issuer: env.appName,
  audience: 'cvpilot-client',
};
