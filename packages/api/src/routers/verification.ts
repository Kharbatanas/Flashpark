import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { verificationDocuments } from '@flashpark/db'

export const verificationRouter = createTRPCRouter({
  // Get my verification documents
  myDocuments: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.verificationDocuments.findMany({
      where: eq(verificationDocuments.userId, ctx.userId),
      orderBy: (docs, { desc }) => [desc(docs.createdAt)],
    })
  }),

  // Upload a verification document
  submit: protectedProcedure
    .input(z.object({
      type: z.enum(['id_card', 'passport', 'drivers_license', 'proof_of_address', 'property_proof']),
      fileUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [doc] = await ctx.db
        .insert(verificationDocuments)
        .values({
          userId: ctx.userId,
          type: input.type,
          fileUrl: input.fileUrl,
          status: 'pending',
        })
        .returning()

      return doc
    }),
})
