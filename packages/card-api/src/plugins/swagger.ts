import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';

const plugin: FastifyPluginAsync = async (app) => {
  await app.register(swagger, {
    openapi: {
      info: { title: 'Card API', version: '0.0.0', description: 'Prepaid card data API' },
      servers: [{ url: 'http://localhost:4000' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: '/documentation' });
  app.get('/openapi.json', async () => app.swagger());
};

export const swaggerPlugin = fp(plugin, { name: 'swagger' });
