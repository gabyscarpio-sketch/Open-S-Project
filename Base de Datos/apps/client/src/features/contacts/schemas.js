import * as z from 'zod';

export const contactSchema = z.object({
  id: z.number(),
  name: z.string().regex(/^[A-Z][a-z]*[ ][A-Z][a-z]{3,}[ ]{0,1}$/, {
    error: 'Tiene que tener nombre y apellido. Ambos comienzan con mayúsculas.',
  }),
  phone: z.string().regex(/^[0](414|424|416|426|422|412|212)[0-9]{7}$/, {
    error: ' Tiene que ser un número venezolano válido.',
  }),
});

/** @typedef {z.infer<typeof contactSchema>} Contact */

export const createContactSchema = contactSchema.pick({ name: true, phone: true });
export const updateContactSchema = contactSchema.pick({ name: true, phone: true });
