import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { buildKey, presignUpload } from '@cpfa/lib/storage';
import { router, protectedProcedure } from '../trpc';
import { serverError } from '@/lib/server-errors';

export const attachmentsRouter = router({
  // Step 1: client requests a presigned PUT URL for a file it's about to upload.
  // Server validates ownership of the target registration before signing.
  createPresignedUpload: protectedProcedure
    .input(
      z.object({
        registrationId: z.string().cuid(),
        label: z.string().min(2).max(80),
        fileName: z.string().min(1).max(160),
        mimeType: z.string().min(3).max(120),
        sizeBytes: z.number().int().min(1).max(25 * 1024 * 1024),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const reg = await ctx.prisma.registration.findFirst({
        where: { id: input.registrationId, userId: ctx.session.user.id },
        select: { id: true, status: true },
      });
      if (!reg) throw new TRPCError({ code: 'NOT_FOUND' });
      if (reg.status === 'VALIDATED' || reg.status === 'REJECTED' || reg.status === 'CANCELLED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: serverError('attachmentsClosed', ctx.locale),
        });
      }

      const key = buildKey('attachment', reg.id, input.fileName);
      const presigned = await presignUpload({
        key,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
      });
      return { ...presigned, key };
    }),

  // Step 2: client confirms the upload succeeded — we record the Attachment row.
  confirm: protectedProcedure
    .input(
      z.object({
        registrationId: z.string().cuid(),
        label: z.string().min(2).max(80),
        storageKey: z.string().min(8).max(400),
        mimeType: z.string(),
        sizeBytes: z.number().int().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const reg = await ctx.prisma.registration.findFirst({
        where: { id: input.registrationId, userId: ctx.session.user.id },
        select: { id: true },
      });
      if (!reg) throw new TRPCError({ code: 'NOT_FOUND' });

      return ctx.prisma.attachment.create({
        data: {
          registrationId: reg.id,
          label: input.label,
          storageKey: input.storageKey,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
        },
      });
    }),
});
