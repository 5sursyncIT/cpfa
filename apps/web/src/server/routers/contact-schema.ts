import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().min(2, 'Au moins 2 caractères').max(120),
  email: z.string().email('Email invalide'),
  phone: z.string().min(7).max(20).optional(),
  subject: z.string().min(3, 'Sujet trop court').max(160),
  message: z.string().min(20, 'Message trop court (20 caractères min.)').max(5000),
});

export type ContactInput = z.infer<typeof contactSchema>;
