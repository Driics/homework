import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { createLogger } from '../src/logger.js';

describe('createLogger', () => {
  it('returns a logger with the requested level', () => {
    const log = createLogger({ level: 'warn', pretty: false });
    expect(log.level).toBe('warn');
  });

  it('emits service=miniapp-server in log records', () => {
    const lines: string[] = [];
    const dest = new Writable({
      write(chunk: Buffer, _enc: BufferEncoding, cb: () => void) {
        lines.push(chunk.toString());
        cb();
      },
    });
    const log = createLogger({ level: 'info', pretty: false, destination: dest });
    log.info('probe');
    expect(lines.length).toBeGreaterThan(0);
    const record = JSON.parse(lines[0]!) as { service: string };
    expect(record.service).toBe('miniapp-server');
  });
});
