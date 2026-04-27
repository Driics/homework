import { z } from 'zod';
import { UserPublicSchema } from './user.js';

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({
  token: z.string().min(1),
  expiresAt: z.string().datetime(),
  user: UserPublicSchema,
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
