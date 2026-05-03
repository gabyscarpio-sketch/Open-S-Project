import * as z from 'zod';

export const loginRouteSchema = {
  body: z.object({ email: z.string(), password: z.string() }),
  params: null,
  query: null,
};

export const verifyRouteSchema = {
  body: z.object({ token: z.jwt() }),
  params: null,
  query: null,
};
