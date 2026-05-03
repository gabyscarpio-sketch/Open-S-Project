import * as z from 'zod';

const NAME_REGEX = /^[A-Z][a-z]*[ ][A-Z][a-z]{3,}[ ]{0,1}$/;
const PHONE_REGEX = /^[0](414|424|416|426|422|412|212)[0-9]{7}$/;

export const contactSchema = z.object({
  id: z.number(),
  name: z.string().regex(NAME_REGEX, { error: 'Mal formato' }),
  phone: z.string().regex(PHONE_REGEX, { error: 'Mal formato' }),
  user_id: z.number(),
});

/** @typedef { z.infer<typeof contactSchema> } Contact */
