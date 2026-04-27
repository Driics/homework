import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { AppError, ValidationError } from '../errors.js';

function isFastifyValidationError(err: unknown): err is { validation: unknown[]; message: string } {
  return typeof err === 'object' && err !== null && 'validation' in err;
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
    return reply.code(500).send({ code: 'INTERNAL', message: 'Internal server error', requestId });
  });

  app.setNotFoundHandler((req, reply) => {
    reply.code(404).send({ code: 'NOT_FOUND', message: 'Not Found', requestId: req.id });
  });
};

export const errorHandlerPlugin = fp(plugin, { name: 'errorHandler' });
