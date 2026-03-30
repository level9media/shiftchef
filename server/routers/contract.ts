import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { notifyOwner } from "../_core/notification";

export const contractRouter = router({
  // Get contract signing status for current user
  status: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [user] = await db.select({
      contractSigned: users.contractSigned,
      contractSignedAt: users.contractSignedAt,
      name: users.name,
      email: users.email,
    }).from(users).where(eq(users.id, ctx.user.id)).limit(1);

    return user ?? null;
  }),

  // Worker signs the 1099 contractor agreement
  sign: protectedProcedure
    .input(z.object({
      agreedToTerms: z.literal(true),
      legalName: z.string().min(2),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get client IP from request headers
      const ip =
        (ctx.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        ctx.req.socket?.remoteAddress ||
        "unknown";

      await db.update(users).set({
        contractSigned: true,
        contractSignedAt: new Date(),
        contractIp: ip,
        onboardingStep: 2,
      }).where(eq(users.id, ctx.user.id));

      await notifyOwner({
        title: "Contractor Agreement Signed",
        content: `Worker ${ctx.user.name || ctx.user.email} (ID: ${ctx.user.id}) signed the 1099 Independent Contractor Agreement. Legal name: ${input.legalName}. IP: ${ip}. Timestamp: ${new Date().toISOString()}.`,
      });

      return { success: true, signedAt: new Date() };
    }),
});
