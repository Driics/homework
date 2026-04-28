import type { FastifyPluginAsync } from 'fastify';

export const logoutRoutes: FastifyPluginAsync = async (app) => {
  app.post('/api/logout', { preHandler: [app.verifyInitData] }, async (req, reply) => {
    await app.sessions.delete(req.telegramUser.id);
    return reply.code(204).send();
  });
};
