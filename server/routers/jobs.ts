import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createJob,
  getEmployerJobs,
  getJobById,
  getLiveJobs,
  getUserById,
  updateJob,
  updateUser,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const JOB_ROLES = [
  "cook",
  "sous_chef",
  "prep",
  "dishwasher",
  "cleaner",
  "server",
  "bartender",
  "host",
  "manager",
] as const;

export const jobsRouter = router({
  // Public: list live jobs by city
  list: publicProcedure
    .input(z.object({ city: z.string().default("Austin, TX") }))
    .query(async ({ input }) => {
      return getLiveJobs(input.city);
    }),

  // Get single job
  get: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const job = await getJobById(input.id);
    if (!job) throw new TRPCError({ code: "NOT_FOUND" });
    return job;
  }),

  // Employer: get their own jobs
  myJobs: protectedProcedure.query(async ({ ctx }) => {
    return getEmployerJobs(ctx.user.id);
  }),

  // Employer: create a job
  create: protectedProcedure
    .input(
      z.object({
        role: z.enum(JOB_ROLES),
        payRate: z.number().min(7.25).max(500),
        startTime: z.number(), // UTC ms
        endTime: z.number(),
        city: z.string().default("Austin, TX"),
        location: z.string().max(256),
        description: z.string().max(2000).optional(),
        minRating: z.number().min(0).max(5).default(0),
        isPermanent: z.boolean().default(false),
        restaurantName: z.string().max(256).optional(),
        restaurantImage: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const employer = await getUserById(ctx.user.id);
      if (!employer) throw new TRPCError({ code: "NOT_FOUND" });

      // Check posting credits
      const hasSubscription = employer.subscriptionStatus === "active";
      const hasCredits = (employer.postsRemaining ?? 0) > 0;

      if (!hasSubscription && !hasCredits) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No posting credits. Please purchase a plan.",
        });
      }

      if (input.startTime >= input.endTime) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "End time must be after start time" });
      }

      // Calculate total pay
      const hours = (input.endTime - input.startTime) / (1000 * 60 * 60);
      const totalPay = (hours * input.payRate).toFixed(2);

      const job = await createJob({
        employerId: ctx.user.id,
        role: input.role,
        payRate: String(input.payRate),
        startTime: input.startTime,
        endTime: input.endTime,
        totalPay: totalPay,
        city: input.city,
        location: input.location,
        description: input.description,
        minRating: input.minRating,
        isPermanent: input.isPermanent,
        restaurantName: input.restaurantName,
        restaurantImage: input.restaurantImage,
        status: "live",
      });

      // Deduct credit if not subscription
      if (!hasSubscription) {
        await updateUser(ctx.user.id, {
          postsRemaining: Math.max(0, (employer.postsRemaining ?? 0) - 1),
        });
      }

      return { success: true, jobId: job.insertId };
    }),

  // Employer: cancel a job
  cancel: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const job = await getJobById(input.id);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      if (job.employerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (job.status === "filled") throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot cancel a filled job" });
      await updateJob(input.id, { status: "cancelled" });
      return { success: true };
    }),

  // Employer: mark shift as completed
  complete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const job = await getJobById(input.id);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      if (job.employerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (job.status !== "filled") throw new TRPCError({ code: "BAD_REQUEST", message: "Job must be filled to complete" });
      await updateJob(input.id, { status: "completed" });
      return { success: true };
    }),
});
