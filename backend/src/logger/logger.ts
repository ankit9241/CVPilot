import { loggerConfig } from '../config/logger';

type Level = 'debug' | 'info' | 'warn' | 'error';

const order: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = order[(loggerConfig.level as Level) ?? 'info'] ?? 20;

function log(level: Level, msg: string, meta?: unknown): void {
  if (order[level] < threshold) return;
  const line = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...(meta ? { meta } : {}),
  };
  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level](
    loggerConfig.pretty ? `[${line.ts}] ${level.toUpperCase()} ${msg}` : JSON.stringify(line),
    meta && loggerConfig.pretty ? meta : '',
  );
}

export const logger = {
  debug: (m: string, meta?: unknown) => log('debug', m, meta),
  info: (m: string, meta?: unknown) => log('info', m, meta),
  warn: (m: string, meta?: unknown) => log('warn', m, meta),
  error: (m: string, meta?: unknown) => log('error', m, meta),
};
