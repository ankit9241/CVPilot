import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { appConfig } from './config/app';
import { env } from './config/env';
import { logger } from './logger/logger';
import { errorHandler, notFoundHandler, requestLogger, globalRateLimiter } from './middleware';
import api from './routes';
import { connectDatabase, disconnectDatabase } from './db/prisma';

export function createApp(): Application {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: appConfig.corsOrigin,
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: appConfig.bodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: appConfig.bodyLimit }));
  app.use(requestLogger);
  app.use(globalRateLimiter);

  app.get('/', (_req, res) => res.json({ success: true, data: { name: appConfig.name, api: appConfig.apiPrefix } }));
  app.use(appConfig.apiPrefix, api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

async function bootstrap() {
  const app = createApp();
  try {
    await connectDatabase();
    logger.info('Database connected');
  } catch (err) {
    logger.warn('Database connection failed – continuing without DB (dummy mode)', {
      err: err instanceof Error ? err.message : String(err),
    });
  }

  const server = app.listen(appConfig.port, () => {
    logger.info(`🚀 ${appConfig.name} API listening on http://localhost:${appConfig.port}${appConfig.apiPrefix}`);
    logger.info(`Environment: ${env.nodeEnv}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal} – shutting down`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

if (require.main === module) {
  void bootstrap();
}
// Trigger restart

