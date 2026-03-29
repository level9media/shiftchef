import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createRating,
  getJobById,
  getPaymentByJob,
  getRatingByJobAndRater,
  getRatingsByJob,
  getRatingsForUser,
  updateRating,
  updateUser,
  getUserById,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const RATING_LABELS: Record<number, string> = {
  5: "Absolutely",
  4: "Sure",
  3: "Maybe",
  2: "Not really",
  1: "Never",
};

export const ratingsRouter = router({
  // Submit a rating (worker rates employer or employer rates worker)
  submit: protectedProcedure
    .input(
      z.object({
        jobId: z.number(),
        score: z.number().int().min(1).max(5),
        comment: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const job = await getJobById(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });

      // Must be completed
      if (job.status !== "completed") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Job must be completed before rating" });
      }

      // Payment must be released
      const payment = await getPaymentByJob(input.jobId);
      if (!payment || payment.status !== "released") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Ratings are only available after payment has been released",
        });
      }

      // Determine who is rating whom
      const isEmployer = job.employerId === ctx.user.id;
      const isWorker = job.acceptedWorkerId === ctx.user.id;

      if (!isEmployer && !isWorker) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not part of this shift" });
      }

      const toUserId = isEmployer ? (job.acceptedWorkerId ?? 0) : job.employerId;
      const raterType = isEmployer ? "employer" : "worker";

      // Check if already rated
      const existing = await getRatingByJobAndRater(input.jobId, ctx.user.id);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "You have already submitted a rating for this shift" });
      }

      await createRating({
        jobId: input.jobId,
        paymentId: payment.id,
        fromUserId: ctx.user.id,
        toUserId,
        score: input.score,
        comment: input.comment,
        raterType,
      });

      // Recalculate recipient's average rating
      const allRatings = await getRatingsForUser(toUserId);
      const avg = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;
      await updateUser(toUserId, {
        rating: Math.round(avg * 10) / 10,
        totalRatings: allRatings.length,
      });

      return { success: true };
    }),

  // Employer: respond to a rating (cannot edit)
  respond: protectedProcedure
    .input(z.object({ ratingId: z.number(), response: z.string().max(500) }))
    .mutation(async ({ ctx, input }) => {
      const { getRatingsByJob: _, ...rest } = await import("../db");
      const db = await import("../db");
      const allRatings = await db.getRatingsForUser(ctx.user.id);
      // Find the rating
      const rating = allRatings.find((r) => r.id === input.ratingId);
      // Actually let's query directly
      const job = await getJobById(0); // placeholder
      // Use a direct approach
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { ratings: ratingsTable } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const found = await drizzleDb
        .select()
        .from(ratingsTable)
        .where(eq(ratingsTable.id, input.ratingId))
        .limit(1);

      if (!found[0]) throw new TRPCError({ code: "NOT_FOUND" });

      // Only the person being rated can respond
      if (found[0].toUserId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only respond to ratings about you" });
      }

      if (found[0].response) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You have already responded to this rating" });
      }

      await updateRating(input.ratingId, { response: input.response });
      return { success: true };
    }),

  // Get ratings for a job (only if payment released)
  forJob: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ ctx, input }) => {
      const job = await getJobById(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });

      const payment = await getPaymentByJob(input.jobId);
      if (!payment || payment.status !== "released") {
        return []; // Ratings locked until payment released
      }

      return getRatingsByJob(input.jobId);
    }),

  // Get all ratings for a user (public profile)
  forUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return getRatingsForUser(input.userId);
    }),

  // Get my pending ratings (shifts I need to rate)
  pendingRatings: protectedProcedure.query(async ({ ctx }) => {
    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) return [];

    const { jobs: jobsTable, payments: paymentsTable, ratings: ratingsTable } = await import("../../drizzle/schema");
    const { eq, or, and, isNull } = await import("drizzle-orm");

    // Find completed jobs where payment is released and I haven't rated yet
    const myCompletedJobs = await db
      .select()
      .from(jobsTable)
      .where(
        and(
          eq(jobsTable.status, "completed"),
          or(
            eq(jobsTable.employerId, ctx.user.id),
            eq(jobsTable.acceptedWorkerId, ctx.user.id)
          )
        )
      );

    const pending = [];
    for (const job of myCompletedJobs) {
      const payment = await getPaymentByJob(job.id);
      if (!payment || payment.status !== "released") continue;

      const myRating = await getRatingByJobAndRater(job.id, ctx.user.id);
      if (!myRating) {
        pending.push({ job, payment });
      }
    }

    return pending;
  }),

  ratingLabels: protectedProcedure.query(() => RATING_LABELS),
});
