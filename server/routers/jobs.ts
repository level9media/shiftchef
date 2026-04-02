import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createJob,
  getEmployerJobs,
  getJobById,
  getLiveJobs,
  getActivityStats,
  getUserById,
  updateJob,
  updateUser,
  getApplicationById,
  updateApplication,
  cancelOverlappingApplications,
  sendEmail,
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
        startTime: z.number(),
        endTime: z.number(),
        city: z.string().default("Austin, TX"),
        location: z.string().max(256),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        contactName: z.string().max(256).optional(),
        contactPhone: z.string().max(32).optional(),
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

      const hours = (input.endTime - input.startTime) / (1000 * 60 * 60);
      const totalPay = (hours * input.payRate).toFixed(2);

      const job = await createJob({
        employerId: ctx.user.id,
        role: input.role,
        payRate: String(input.payRate),
        startTime: input.startTime,
        endTime: input.endTime,
        totalPay,
        city: input.city,
        location: input.location,
        latitude: input.latitude,
        longitude: input.longitude,
        contactName: input.contactName,
        contactPhone: input.contactPhone,
        description: input.description,
        minRating: input.minRating,
        isPermanent: input.isPermanent,
        restaurantName: input.restaurantName,
        restaurantImage: input.restaurantImage,
        status: "live",
      });

      if (!hasSubscription) {
        const newRemaining = Math.max(0, (employer.postsRemaining ?? 0) - 1);
        const wasFreePost = !employer.freePostUsed && (employer.postsRemaining ?? 0) === 1;
        await updateUser(ctx.user.id, {
          postsRemaining: newRemaining,
          ...(wasFreePost ? { freePostUsed: true } : {}),
        });
      }

      return { success: true, jobId: job.insertId };
    }),

  // Public: live activity stats
  activityStats: publicProcedure
    .input(z.object({ city: z.string().default("Austin, TX") }))
    .query(async ({ input }) => {
      return getActivityStats(input.city);
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

  // Employer: mark shift complete
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

  // Worker: start shift
  startShift: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const app = await getApplicationById(input.applicationId);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });
      if (app.workerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (app.status !== "accepted") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Application must be accepted before starting shift" });
      }
      await updateApplication(input.applicationId, {
        checkInAt: Date.now(),
        status: "accepted",
      });
      return { success: true, checkInAt: Date.now() };
    }),

  // Worker: end shift — notifies employer
  endShift: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const app = await getApplicationById(input.applicationId);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });
      if (app.workerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (!app.checkInAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Shift hasn't been started yet" });
      }

      const checkOutAt = Date.now();
      const hoursWorked = ((checkOutAt - app.checkInAt) / 3600000).toFixed(2);

      await updateApplication(input.applicationId, {
        checkOutAt,
        hoursWorked,
      });

      // Send email to employer
      const worker = await getUserById(ctx.user.id);
      const job = await getJobById(app.jobId);
      if (job && worker) {
        const employer = await getUserById(job.employerId);
        if (employer?.email) {
          await sendEmail({
            to: employer.email,
            subject: `${worker.name} is ending their shift`,
            html: `
              <h2>${worker.name} is clocking out</h2>
              <p>Your worker has ended their shift for <strong>${job.restaurantName ?? "your location"}</strong>.</p>
              <p><strong>Hours worked:</strong> ${hoursWorked}h</p>
              <p><strong>Total owed:</strong> $${(parseFloat(hoursWorked) * parseFloat(job.payRate)).toFixed(2)}</p>
              <p>Log in to ShiftChef to approve and release payment.</p>
            `,
          });
        }
      }

      return { success: true, hoursWorked };
    }),

  // Employer: approve shift end + trigger payment
  approveShiftEnd: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const app = await getApplicationById(input.applicationId);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });

      const job = await getJobById(app.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      if (job.employerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      await updateApplication(input.applicationId, { status: "completed" });
      await updateJob(app.jobId, { status: "completed" });

      return { success: true, applicationId: input.applicationId };
    }),
});
