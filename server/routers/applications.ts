import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { notifyOwner } from "../_core/notification";
import {
  createApplication,
  getApplicationByJobAndWorker,
  getApplicationById,
  getApplicationsByJob,
  getApplicationsByWorker,
  getJobById,
  getUserById,
  updateApplication,
  updateJob,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const applicationsRouter = router({
  // Worker: apply to a job
  applyToJob: protectedProcedure
    .input(
      z.object({
        jobId: z.number(),
        coverNote: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const worker = await getUserById(ctx.user.id);
      if (!worker) throw new TRPCError({ code: "NOT_FOUND" });

      const job = await getJobById(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      if (job.status !== "live") throw new TRPCError({ code: "BAD_REQUEST", message: "Job is no longer available" });

      // Block if below min rating
      const workerRating = worker.rating ?? 5;
      if (job.minRating && workerRating < job.minRating) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Your rating (${workerRating.toFixed(1)}) is below the minimum required (${job.minRating})`,
        });
      }

      // Check if already applied
      const existing = await getApplicationByJobAndWorker(input.jobId, ctx.user.id);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "You have already applied to this job" });
      }

      // Cannot apply to own job
      if (job.employerId === ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot apply to your own job" });
      }

      await createApplication({
        jobId: input.jobId,
        workerId: ctx.user.id,
        employerId: job.employerId,
        coverNote: input.coverNote,
        status: "pending",
      });

      return { success: true };
    }),

  // Worker: get their applications
  myApplications: protectedProcedure.query(async ({ ctx }) => {
    const apps = await getApplicationsByWorker(ctx.user.id);
    // Enrich with job data
    const enriched = await Promise.all(
      apps.map(async (app) => {
        const job = await getJobById(app.jobId);
        return { ...app, job };
      })
    );
    return enriched;
  }),

  // Employer: get applicants for a job
  forJob: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ ctx, input }) => {
      const job = await getJobById(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      if (job.employerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      const apps = await getApplicationsByJob(input.jobId);
      const enriched = await Promise.all(
        apps.map(async (app) => {
          const worker = await getUserById(app.workerId);
          if (!worker) return { ...app, worker: null };
          const { stripeAccountId, stripeCustomerId, subscriptionId, openId, ...pub } = worker;
          return { ...app, worker: pub };
        })
      );
      return enriched;
    }),

  // Employer: accept an application
  accept: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const app = await getApplicationById(input.applicationId);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });
      if (app.employerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      const job = await getJobById(app.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      if (job.status !== "live") throw new TRPCError({ code: "BAD_REQUEST", message: "Job is no longer available" });

      // Payment must be made before confirmation
      if (job.paymentStatus !== "held") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payment must be completed before accepting a worker",
        });
      }

      // Accept this application
      await updateApplication(input.applicationId, { status: "accepted" });

      // Reject all other pending applications for this job
      const allApps = await getApplicationsByJob(app.jobId);
      for (const other of allApps) {
        if (other.id !== input.applicationId && other.status === "pending") {
          await updateApplication(other.id, { status: "rejected" });
        }
      }

      // Mark job as filled
      await updateJob(app.jobId, { status: "filled", acceptedWorkerId: app.workerId });

      // Notify owner of accepted shift
      const worker = await getUserById(app.workerId);
      notifyOwner({
        title: "ShiftChef: Shift Confirmed",
        content: `${job.restaurantName ?? "Employer"} accepted ${worker?.name ?? "a worker"} for ${job.role} shift.`,
      }).catch(() => {});

      return { success: true };
    }),

  // Employer: reject an application
  reject: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const app = await getApplicationById(input.applicationId);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });
      if (app.employerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await updateApplication(input.applicationId, { status: "rejected" });
      return { success: true };
    }),

  // Worker: withdraw application
  withdraw: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const app = await getApplicationById(input.applicationId);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });
      if (app.workerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (app.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Can only withdraw pending applications" });
      await updateApplication(input.applicationId, { status: "cancelled" });
      return { success: true };
    }),
});
