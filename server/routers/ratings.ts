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
  getDb,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

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

      // Update reliability score: percentage of shifts rated (engagement metric)
      const db = await getDb();
      let reliabilityScore = 100;
      if (db) {
        const { jobs: jobsTable } = await import("../../drizzle/schema");
        const { eq, or, and } = await import("drizzle-orm");
        const completedJobs = await db
          .select()
          .from(jobsTable)
          .where(
            and(
              eq(jobsTable.status, "completed"),
              or(eq(jobsTable.employerId, toUserId), eq(jobsTable.acceptedWorkerId, toUserId))
            )
          );
        const totalCompleted = completedJobs.length;
        if (totalCompleted > 0) {
          const ratingsGiven = allRatings.length;
          reliabilityScore = Math.min(100, Math.round((ratingsGiven / totalCompleted) * 100));
        }
      }

      await updateUser(toUserId, {
        rating: Math.round(avg * 10) / 10,
        totalRatings: allRatings.length,
        reliabilityScore,
      });

      return { success: true, raterType };
    }),

  // Respond to a rating (the person who was rated can respond once)
  respond: protectedProcedure
    .input(z.object({ ratingId: z.number(), response: z.string().max(500) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { ratings: ratingsTable } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const found = await db
        .select()
        .from(ratingsTable)
        .where(eq(ratingsTable.id, input.ratingId))
        .limit(1);

      if (!found[0]) throw new TRPCError({ code: "NOT_FOUND" });

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
        return [];
      }

      return getRatingsByJob(input.jobId);
    }),

  // Get all ratings received by a user (public — no payment gate, for profiles)
  forUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const { ratings: ratingsTable, users } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      // Join with rater info
      const rows = await db
        .select({
          id: ratingsTable.id,
          jobId: ratingsTable.jobId,
          score: ratingsTable.score,
          comment: ratingsTable.comment,
          response: ratingsTable.response,
          raterType: ratingsTable.raterType,
          createdAt: ratingsTable.createdAt,
          raterName: users.name,
          raterImage: users.profileImage,
          raterRole: users.userType,
        })
        .from(ratingsTable)
        .leftJoin(users, eq(ratingsTable.fromUserId, users.id))
        .where(eq(ratingsTable.toUserId, input.userId))
        .orderBy(ratingsTable.createdAt);

      return rows.reverse(); // newest first
    }),

  // Get ratings I have given
  given: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const { ratings: ratingsTable, users, jobs: jobsTable } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const rows = await db
      .select({
        id: ratingsTable.id,
        jobId: ratingsTable.jobId,
        score: ratingsTable.score,
        comment: ratingsTable.comment,
        raterType: ratingsTable.raterType,
        createdAt: ratingsTable.createdAt,
        recipientName: users.name,
        recipientImage: users.profileImage,
        recipientType: users.userType,
        jobRole: jobsTable.role,
        jobRestaurant: jobsTable.restaurantName,
      })
      .from(ratingsTable)
      .leftJoin(users, eq(ratingsTable.toUserId, users.id))
      .leftJoin(jobsTable, eq(ratingsTable.jobId, jobsTable.id))
      .where(eq(ratingsTable.fromUserId, ctx.user.id))
      .orderBy(ratingsTable.createdAt);

    return rows.reverse();
  }),

  // Get rating stats for a user (avg, count, score breakdown)
  stats: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const allRatings = await getRatingsForUser(input.userId);
      if (allRatings.length === 0) {
        return { avg: 0, total: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
      }
      const avg = allRatings.reduce((s, r) => s + r.score, 0) / allRatings.length;
      const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      for (const r of allRatings) {
        breakdown[r.score] = (breakdown[r.score] ?? 0) + 1;
      }
      return {
        avg: Math.round(avg * 10) / 10,
        total: allRatings.length,
        breakdown,
      };
    }),

  // Get my pending ratings (shifts I need to rate)
  pendingRatings: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const { jobs: jobsTable } = await import("../../drizzle/schema");
    const { eq, or, and } = await import("drizzle-orm");

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
        // Get the other party's info
        const otherUserId = job.employerId === ctx.user.id
          ? (job.acceptedWorkerId ?? 0)
          : job.employerId;
        const otherUser = otherUserId ? await getUserById(otherUserId) : null;
        pending.push({ job, payment, otherUser });
      }
    }

    return pending;
  }),

  // Get completed shifts for rating context (single job detail)
  jobRatingContext: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ ctx, input }) => {
      const job = await getJobById(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });

      const isEmployer = job.employerId === ctx.user.id;
      const isWorker = job.acceptedWorkerId === ctx.user.id;
      if (!isEmployer && !isWorker) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not part of this shift" });
      }

      const payment = await getPaymentByJob(input.jobId);
      const myRating = await getRatingByJobAndRater(input.jobId, ctx.user.id);

      const otherUserId = isEmployer ? (job.acceptedWorkerId ?? 0) : job.employerId;
      const otherUser = otherUserId ? await getUserById(otherUserId) : null;

      return {
        job,
        payment,
        myRating,
        otherUser,
        isEmployer,
        canRate: job.status === "completed" && payment?.status === "released" && !myRating,
      };
    }),

  ratingLabels: protectedProcedure.query(() => RATING_LABELS),
});
