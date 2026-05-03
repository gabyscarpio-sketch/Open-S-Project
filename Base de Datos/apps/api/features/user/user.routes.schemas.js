import * as z from 'zod';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\S]{8,}$/;

export const createUserRouteSchema = {
  body: z.object({
    email: z.string().email({ error: 'Tiene que ser un email valido' }),
    password: z.string().regex(PASSWORD_REGEX, {
      error: 'Recuerda cumplir los requerimientos de la contraseña',
    }),
  }),
  params: null,
  query: null,
};
