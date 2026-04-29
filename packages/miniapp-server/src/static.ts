import { existsSync } from 'node:fs';
import path from 'node:path';
import fastifyStatic from '@fastify/static';
import type { FastifyPluginAsync } from 'fastify';

export type StaticOptions = { rootDir: string };

export const staticPlugin =
  (opts: StaticOptions): FastifyPluginAsync =>
  async (app) => {
    const absRoot = path.resolve(opts.rootDir);
    if (!existsSync(absRoot)) {
      app.log.warn({ absRoot }, 'miniapp-web dist not found; skipping static hosting');
      return;
    }
    await app.register(fastifyStatic, { root: absRoot, wildcard: false });
    app.get('/*', async (req, reply) => {
      if (req.url.startsWith('/api') || req.url.startsWith('/telegram')) {
        return reply.code(404).send({ code: 'NOT_FOUND', message: 'Not Found', requestId: req.id });
      }
      return reply.sendFile('index.html');
    });
  };
