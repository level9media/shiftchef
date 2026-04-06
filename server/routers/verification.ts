import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { users, verificationRequests } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { notifyOwner } from "../_core/notification";
import { storagePut } from "../storage";

export const verificationRouter = router({
  submit: protectedProcedure
    .input(z.object({
      legalName: z.string().min(2).max(256),
      idImageBase64: z.string(),
      selfieBase64: z.string().optional(),
      mimeType: z.string().default("image/jpeg"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const idBuffer = Buffer.from(input.idImageBase64.replace(/^data:image\/\w+;base64,/, ""), "base64");
      const idKey = `verifications/${ctx.user.id}-id-${Date.now()}.jpg`;
      const { url: idImageUrl } = await storagePut(idKey, idBuffer, input.mimeType);

      let selfieUrl: string | undefined;
      if (input.selfieBase64) {
        const selfieBuffer = Buffer.from(input.selfieBase64.replace(/^data:image\/\w+;base64,/, ""), "base64");
        const selfieKey = `verifications/${ctx.user.id}-selfie-${Date.now()}.jpg`;
        const { url } = await storagePut(selfieKey, selfieBuffer, input.mimeType);
        selfieUrl = url;
      }

      await db.insert(verificationRequests).values({
        workerId: ctx.user.id,
        idImageUrl,
        selfieUrl,
        legalName: input.legalName,
        status: "pending",
      });

      await db.update(users)
        .set({ verificationStatus: "pending" })
        .where(eq(users.id, ctx.user.id));

      await notifyOwner({
        title: "New Verification Request",
        content: `Worker ${ctx.user.name || ctx.user.email} (ID: ${ctx.user.id}) submitted ID verification. Legal name: ${input.legalName}. Review in Admin Dashboard.`,
      });

      return { success: true, status: "pending" };
    }),

  myStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [user] = await db.select({
      verificationStatus: users.verificationStatus,
      verificationNote: users.verificationNote,
      verifiedAt: users.verifiedAt,
      contractSigned: users.contractSigned,
      contractSignedAt: users.contractSignedAt,
    }).from(users).where(eq(users.id, ctx.user.id)).limit(1);

    return user ?? null;
  }),

  adminQueue: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const requests = await db
      .select({
        id: verificationRequests.id,
        workerId: verificationRequests.workerId,
        legalName: verificationRequests.legalName,
        idImageUrl: verificationRequests.idImageUrl,
        selfieUrl: verificationRequests.selfieUrl,
        status: verificationRequests.status,
        adminNote: verificationRequests.adminNote,
        createdAt: verificationRequests.createdAt,
        workerName: users.name,
        workerEmail: users.email,
        workerRating: users.rating,
      })
      .from(verificationRequests)
      .leftJoin(users, eq(verificationRequests.workerId, users.id))
      .orderBy(desc(verificationRequests.createdAt));

    return requests;
  }),

  adminReview: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      decision: z.enum(["approved", "rejected"]),
      adminNote: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [req] = await db.select().from(verificationRequests)
        .where(eq(verificationRequests.id, input.requestId)).limit(1);
      if (!req) throw new TRPCError({ code: "NOT_FOUND" });

      await db.update(verificationRequests).set({
        status: input.decision,
        adminNote: input.adminNote,
        reviewedBy: ctx.user.id,
        reviewedAt: new Date(),
      }).where(eq(verificationRequests.id, input.requestId));

      const newStatus = input.decision === "approved" ? "verified" : "rejected";
      await db.update(users).set({
        verificationStatus: newStatus,
        verificationNote: input.adminNote,
        verifiedAt: input.decision === "approved" ? new Date() : undefined,
      }).where(eq(users.id, req.workerId));

      return { success: true, newStatus };
    }),

  createStripeSession: protectedProcedure
    .mutation(async ({ ctx }) => {
      const stripe = new (await import("stripe")).default(process.env.STRIPE_SECRET_KEY!);
      const appUrl = process.env.APP_URL || "https://www.shiftchef.co";
      const session = await stripe.identity.verificationSessions.create({
        type: "document",
        metadata: { userId: String(ctx.user.id) },
        return_url: `${appUrl}/verify?stripe=complete`,
      });
      return { url: session.url };
    }),
});