import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { notifyOwner } from "../_core/notification";
import { sendHireNotification, sendRejectionNotification } from "../_core/hireNotification";
import { smsNewApplication, smsWorkerHired, smsWorkerRejected } from "../_core/sms";
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

      // Block if not verified
      if (worker.verificationStatus && worker.verificationStatus !== "verified") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your ID must be verified before applying. Complete verification in your profile.",
        });
      }

      // Block if contract not signed
      if (worker.contractSigned === false) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must sign the contractor agreement before applying to shifts.",
        });
      }

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

      notifyOwner({
        title: "ShiftChef: New Applicant",
        content: `${worker.name ?? "A worker"} applied to ${job.role} at ${job.restaurantName ?? "your restaurant"}.`,
      }).catch(() => {});

      // SMS employer about new applicant
      const employer = await getUserById(job.employerId);
      smsNewApplication({
        employerPhone: employer?.phone,
        workerName: worker.name ?? "A worker",
        role: job.role,
        restaurantName: job.restaurantName,
        city: job.city,
      }).catch(() => {});

      return { success: true };
    }),

  // Worker: get their applications (enriched with job data)
  myApplications: protectedProcedure.query(async ({ ctx }) => {
    const apps = await getApplicationsByWorker(ctx.user.id);
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

  // Employer: accept (hire) a worker — no payment required upfront
  accept: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const app = await getApplicationById(input.applicationId);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });
      if (app.employerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      const job = await getJobById(app.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      if (job.status !== "live") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Job is no longer available" });
      }

      // Accept this application
      await updateApplication(input.applicationId, { status: "accepted" });

      // Reject all other pending applications for this job
      const allApps = await getApplicationsByJob(app.jobId);
      for (const other of allApps) {
        if (other.id !== input.applicationId && other.status === "pending") {
          await updateApplication(other.id, { status: "rejected" });
          // SMS + email rejected workers
          const rejectedWorker = await getUserById(other.workerId);
          if (rejectedWorker) {
            smsWorkerRejected({
              workerPhone: rejectedWorker.phone,
              workerName: rejectedWorker.name ?? "Worker",
              role: job.role,
            }).catch(() => {});
            if (rejectedWorker.email) {
              sendRejectionNotification(
                rejectedWorker.email,
                rejectedWorker.name ?? "Worker",
                job.role
              ).catch(() => {});
            }
          }
        }
      }

      // Mark job as filled
      await updateJob(app.jobId, { status: "filled", acceptedWorkerId: app.workerId });

      // Send hire notification email + SMS to worker
      const worker = await getUserById(app.workerId);
      const employer = await getUserById(ctx.user.id);

      sendHireNotification({
        workerName: worker?.name ?? "Worker",
        workerEmail: worker?.email,
        workerPhone: worker?.phone,
        employerName: employer?.name ?? job.restaurantName ?? "Employer",
        employerEmail: employer?.email,
        employerPhone: employer?.phone,
        restaurantName: job.restaurantName,
        role: job.role,
        startTime: job.startTime,
        endTime: job.endTime,
        payRate: job.payRate,
        location: job.location,
        city: job.city,
        description: job.description,
      }).catch(() => {});

      smsWorkerHired({
        workerPhone: worker?.phone,
        workerName: worker?.name ?? "Worker",
        role: job.role,
        restaurantName: job.restaurantName,
        startTime: job.startTime,
        location: job.location,
        contactName: job.contactName,
        contactPhone: job.contactPhone,
      }).catch(() => {});

      notifyOwner({
        title: "ShiftChef: Worker Hired",
        content: `${worker?.name ?? "Worker"} hired for ${job.role} at ${job.restaurantName ?? "restaurant"}.`,
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
      // SMS + email worker about rejection
      const rejectedWorker = await getUserById(app.workerId);
      const job = await getJobById(app.jobId);
      if (rejectedWorker && job) {
        smsWorkerRejected({
          workerPhone: rejectedWorker.phone,
          workerName: rejectedWorker.name ?? "Worker",
          role: job.role,
        }).catch(() => {});
        if (rejectedWorker.email) {
          sendRejectionNotification(
            rejectedWorker.email,
            rejectedWorker.name ?? "Worker",
            job.role
          ).catch(() => {});
        }
      }
      return { success: true };
    }),

  // Worker: withdraw a pending application
  withdraw: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const app = await getApplicationById(input.applicationId);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });
      if (app.workerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (app.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Can only withdraw pending applications" });
      }
      await updateApplication(input.applicationId, { status: "cancelled" });
      return { success: true };
    }),

  // Employer: get all applications across all their jobs (for dashboard)
  allForEmployer: protectedProcedure.query(async ({ ctx }) => {
    const allJobs = await import("../db").then(db => db.getEmployerJobs(ctx.user.id));
    const result = await Promise.all(
      allJobs.map(async (job) => {
        const apps = await getApplicationsByJob(job.id);
        const enriched = await Promise.all(
          apps.map(async (app) => {
            const worker = await getUserById(app.workerId);
            if (!worker) return { ...app, worker: null, job };
            const { stripeAccountId, stripeCustomerId, subscriptionId, openId, ...pub } = worker;
            return { ...app, worker: pub, job };
          })
        );
        return enriched;
      })
    );
    return result.flat();
  }),
});
