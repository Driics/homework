import type { Writable } from 'node:stream';
import { type Logger, type LoggerOptions, pino } from 'pino';

export type CreateLoggerOptions = {
  level: string;
  pretty: boolean;
  destination?: Writable;
};

export function createLogger(opts: CreateLoggerOptions): Logger {
  const baseOptions: LoggerOptions = {
    level: opts.level,
    base: { service: 'miniapp-server' },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: { paths: ['req.headers.authorization', 'password', '*.password'], remove: true },
  };
  if (opts.pretty) {
    return pino({
      ...baseOptions,
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l' },
      },
    });
  }
  if (opts.destination) {
    return pino(baseOptions, opts.destination);
  }
  return pino(baseOptions);
}
