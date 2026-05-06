import { getQueue } from '@cpfa/lib/queues';
import { router, publicProcedure } from '../trpc';
import { contactSchema } from './contact-schema';

export const contactRouter = router({
  submit: publicProcedure.input(contactSchema).mutation(async ({ ctx, input }) => {
    // Audit trail of every public contact submission, per docs/projet.md §5.
    await ctx.prisma.auditLog.create({
      data: {
        action: 'contact.submit',
        entity: 'ContactForm',
        diff: {
          name: input.name,
          email: input.email,
          phone: input.phone ?? null,
          subject: input.subject,
        },
      },
    });

    // Email is fire-and-forget — the user gets immediate feedback,
    // the worker handles delivery (and retries on transient failure).
    await getQueue('email').add('contact-form', {
      to: process.env.CONTACT_EMAIL ?? 'contact@cpfa.local',
      template: 'magic-link', // TODO(S2): swap for a dedicated 'contact' template once @cpfa/emails has it
      data: { ...input, kind: 'contact' },
    });

    return { ok: true };
  }),
});
