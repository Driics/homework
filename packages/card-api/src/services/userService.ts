import type { UserPublic } from '@homework/shared';
import type { PrismaClient } from '@prisma/client';
import { verifyPassword } from '../auth/password.js';
import { NotFoundError, UnauthorizedError } from '../errors.js';

export type LoginInput = { email: string; password: string };

export async function verifyUserCredentials(
  prisma: PrismaClient,
  input: LoginInput,
): Promise<UserPublic> {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user) {
    await verifyPassword('dummy', '$2b$10$abcdefghijklmnopqrstuuGnIx7/Gle3X6vUlCAyQ3FRPD5eTB6BpS');
    throw new UnauthorizedError('INVALID_CREDENTIALS', 'Invalid email or password');
  }
  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw new UnauthorizedError('INVALID_CREDENTIALS', 'Invalid email or password');
  return { id: user.id, email: user.email, fullName: user.fullName };
}

export async function getUserProfile(prisma: PrismaClient, userId: string): Promise<UserPublic> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('USER_NOT_FOUND', 'User not found');
  return { id: user.id, email: user.email, fullName: user.fullName };
}
