import { type LoggerOptions, pino } from 'pino';

export type CreateLoggerOptions = {
  level: string;
  pretty: boolean;
};

export function createLogger(opts: CreateLoggerOptions): pino.Logger {
  const baseOptions: LoggerOptions = {
    level: opts.level,
    base: { service: 'card-api' },
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
  return pino(baseOptions);
}
