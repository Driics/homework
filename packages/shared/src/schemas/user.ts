import { z } from 'zod';

export const UserPublicSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().min(1),
});
export type UserPublic = z.infer<typeof UserPublicSchema>;
