import * as z from 'zod';

export const UserSchema = z.object({
  id: z.number(),
  email: z.email(),
  password_hash: z.string(),
  email_verified: z.boolean().default(false),
});

/** @typedef { z.infer<typeof UserSchema> } User*/
