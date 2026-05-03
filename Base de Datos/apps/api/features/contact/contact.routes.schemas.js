import * as z from 'zod';
import { contactSchema } from './contact.schemas.js';

export const createContactRouteSchema = {
  body: contactSchema.pick({ name: true, phone: true }),
  params: null,
  query: null,
};

export const getContactsRouteSchema = {
  body: null,
  params: null,
  query: null,
};

export const updateContactRouteSchema = {
  body: contactSchema.pick({ name: true, phone: true }),
  params: z.object({
    id: z.coerce.number({ error: 'No es un id valido' }),
  }),
  query: null,
};

export const deleteContactRouteSchema = {
  body: null,
  params: z.object({
    id: z.coerce.number({ error: 'No es un id valido' }),
  }),
  query: null,
};
