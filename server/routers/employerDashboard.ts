import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getDb,
  getEmployerJobs,
  getApplicationsByJob,
  getPaymentByJob,
  getRatingByJobAndRater,
  getUserById,
} from "../db";
import { eq, and, desc, sql } from "drizzle-orm";
import { jobs, payments, ratings, users, applications } from "../../drizzle/schema";

export const employerDashboardRouter = router({
  /**
   * Full shift history for the logged-in employer.
   * Returns each job with: payment info, accepted worker, rating given.
   */
  history: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    const employerJobs = await getEmployerJobs(ctx.user.id);

    const enriched = await Promise.all(
      employerJobs.map(async (job) => {
        // Get payment record
        const payment = await getPaymentByJob(job.id);

        // Get accepted worker
        let worker = null;
        if (job.acceptedWorkerId) {
          const w = await getUserById(job.acceptedWorkerId);
          if (w) {
            const { stripeAccountId, stripeCustomerId, subscriptionId, openId, ...pub } = w;
            worker = pub;
          }
        }

        // Get rating the employer gave the worker
        const ratingGiven = job.acceptedWorkerId
          ? await getRatingByJobAndRater(job.id, ctx.user.id)
          : null;

        // Get application count
        const apps = await getApplicationsByJob(job.id);
        const applicantCount = apps.length;

        return {
          ...job,
          payment: payment
            ? {
                totalCharged: payment.amount,
                workerPayout: payment.workerPayout,
                platformFee: payment.platformFee,
                status: payment.status,
              }
            : null,
          worker,
          ratingGiven: ratingGiven ? { stars: ratingGiven.score, review: ratingGiven.comment } : null,
          applicantCount,
        };
      })
    );

    // Sort by most recent first
    return enriched.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
  }),

  /**
   * Spending summary stats for the employer.
   */
  summary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    // All payments made by this employer
    const employerPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.employerId, ctx.user.id));

    const totalSpent = employerPayments.reduce((sum, p) => sum + (p.amount ?? 0), 0);
    const totalPlatformFees = employerPayments.reduce((sum, p) => sum + (p.platformFee ?? 0), 0);
    const totalWorkerPayout = employerPayments.reduce((sum, p) => sum + (p.workerPayout ?? 0), 0);
    const completedShifts = employerPayments.filter((p) => p.status === "released").length;
    const heldShifts = employerPayments.filter((p) => p.status === "held").length;
    const avgCostPerShift = completedShifts > 0 ? Math.round(totalSpent / completedShifts) : 0;

    // All ratings the employer gave
    const ratingsGiven = await db
      .select()
      .from(ratings)
      .where(eq(ratings.fromUserId, ctx.user.id));

    const avgRatingGiven =
      ratingsGiven.length > 0
        ? ratingsGiven.reduce((sum, r) => sum + (r.score ?? 0), 0) / ratingsGiven.length
        : null;

    // Unique workers hired
    const allJobs = await getEmployerJobs(ctx.user.id);
    const workerIds = allJobs
      .filter((j) => j.acceptedWorkerId)
      .map((j) => j.acceptedWorkerId as number);
    const uniqueWorkers = new Set(workerIds).size;

    // Preferred workers (hired 2+ times)
    const workerHireCount: Record<number, number> = {};
    for (const wid of workerIds) {
      workerHireCount[wid] = (workerHireCount[wid] ?? 0) + 1;
    }
    const preferredWorkerIds = Object.entries(workerHireCount)
      .filter(([, count]) => count >= 2)
      .map(([id]) => Number(id));

    const preferredWorkers = await Promise.all(
      preferredWorkerIds.map(async (wid) => {
        const w = await getUserById(wid);
        if (!w) return null;
        const { stripeAccountId, stripeCustomerId, subscriptionId, openId, ...pub } = w;
        return { ...pub, hireCount: workerHireCount[wid] };
      })
    );

    return {
      totalSpent,
      totalPlatformFees,
      totalWorkerPayout,
      completedShifts,
      heldShifts,
      avgCostPerShift,
      avgRatingGiven,
      uniqueWorkers,
      totalJobs: allJobs.length,
      preferredWorkers: preferredWorkers.filter(Boolean),
    };
  }),
});
