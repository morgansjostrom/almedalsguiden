import { z } from 'zod';

export const CONTACT_RECIPIENT = 'info@almedalskompassen.se';
const text = z.string().trim().min(1).max(100).refine(value => !/[\u0000-\u001f\u007f]/.test(value));
export const contactSchema = z.object({
  firstName: text,
  lastName: text,
  company: text,
  email: z.string().trim().email().max(254),
}).strict();