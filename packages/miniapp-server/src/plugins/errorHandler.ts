import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { AppError, ValidationError } from '../errors.js';

function isFastifyValidationError(
  err: unknown,
): err is { validation?: unknown[]; message: string; code?: string } {
  if (typeof err !== 'object' || err === null) return false;
  return (
    'validation' in err ||
    ('code' in err && (err as { code: unknown }).code === 'FST_ERR_VALIDATION')
  );
}

const plugin: FastifyPluginAsync = async (app) => {
  app.setErrorHandler((err, req: FastifyRequest, reply) => {
    const requestId = req.id;
    req.log.error({ err, requestId }, 'request failed');

    if (err instanceof AppError) {
      return reply.code(err.statusCode).send(err.toJSON(requestId));
    }
    if (isFastifyValidationError(err)) {
      const wrapped = new ValidationError(
        'VALIDATION_FAILED',
        'Request validation failed',
        err.validation,
      );
      return reply.code(400).send(wrapped.toJSON(requestId));
    }
    const pluginErr = err as { statusCode?: number; message?: string };
    if (pluginErr.statusCode && pluginErr.statusCode >= 400 && pluginErr.statusCode < 500) {
      return reply
        .code(pluginErr.statusCode)
        .send({ code: 'CLIENT_ERROR', message: pluginErr.message ?? 'Client error', requestId });
    }
    return reply.code(500).send({ code: 'INTERNAL', message: 'Internal server error', requestId });
  });

  app.setNotFoundHandler((req, reply) => {
    reply.code(404).send({ code: 'NOT_FOUND', message: 'Not Found', requestId: req.id });
  });
};

export const errorHandlerPlugin = fp(plugin, { name: 'errorHandler' });
