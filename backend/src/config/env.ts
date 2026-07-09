import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function optional(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

function num(name: string, fallback: number): number {
  const v = process.env[name];
  return v ? Number(v) : fallback;
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  isProd: process.env.NODE_ENV === 'production',
  isDev: process.env.NODE_ENV !== 'production',
  port: num('PORT', 4000),
  appName: optional('APP_NAME', 'CVPilot'),
  apiPrefix: optional('API_PREFIX', '/api'),

  database: {
    url: required('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/cvpilot'),
  },

  jwt: {
    accessSecret: required('JWT_SECRET', 'dev-access-secret'),
    accessExpiresIn: optional('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
    refreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  cors: {
    origin: optional('CORS_ORIGIN', 'http://localhost:5173'),
  },

  google: {
    clientId: optional('GOOGLE_CLIENT_ID'),
    clientSecret: optional('GOOGLE_CLIENT_SECRET'),
    callbackUrl: optional('GOOGLE_CALLBACK_URL'),
  },

  aws: {
    region: optional('AWS_REGION', 'us-east-1'),
    accessKeyId: optional('AWS_ACCESS_KEY_ID'),
    secretAccessKey: optional('AWS_SECRET_ACCESS_KEY'),
    bucket: optional('AWS_S3_BUCKET', 'cvpilot-storage'),
  },

  log: {
    level: optional('LOG_LEVEL', 'info'),
  },
} as const;

export type Env = typeof env;
