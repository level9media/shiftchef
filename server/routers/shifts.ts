import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { notifyOwner } from "../_core/notification";
import { smsWorkerCheckedIn, smsWorkerCheckedOut } from "../_core/sms";
import {
  getApplicationById,
  getJobById,
  getUserById,
  updateApplication,
  updateJob,
  updateUser,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const shiftsRouter = router({
  // Worker: check in at shift start
  checkIn: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const app = await getApplicationById(input.applicationId);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });
      if (app.workerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (app.status !== "accepted") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You can only check in to accepted shifts" });
      }
      if (app.checkInAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Already checked in" });
      }

      const job = await getJobById(app.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });

      // Allow check-in within 30 min before shift start
      const now = Date.now();
      const thirtyMinBefore = job.startTime - 30 * 60 * 1000;
      if (now < thirtyMinBefore) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Check-in opens 30 minutes before shift start",
        });
      }

      await updateApplication(input.applicationId, { checkInAt: now });

      notifyOwner({
        title: "ShiftChef: Worker Checked In",
        content: `Worker checked in for ${job.role} at ${job.restaurantName ?? "restaurant"}.`,
      }).catch(() => {});

      // SMS employer that worker clocked in
      const worker = await getUserById(ctx.user.id);
      const employer = await getUserById(app.employerId);
      smsWorkerCheckedIn({
        employerPhone: employer?.phone,
        workerName: worker?.name ?? "Your worker",
        role: job.role,
        restaurantName: job.restaurantName,
        checkInTime: now,
      }).catch(() => {});

      return { success: true, checkInAt: now };
    }),

  // Worker: clock out at shift end
  clockOut: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const app = await getApplicationById(input.applicationId);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });
      if (app.workerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (!app.checkInAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Must check in before clocking out" });
      }
      if (app.checkOutAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Already clocked out" });
      }

      const job = await getJobById(app.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });

      const now = Date.now();
      const checkInMs = Number(app.checkInAt);
      const hoursWorked = Math.round(((now - checkInMs) / 3_600_000) * 100) / 100;
      const payRate = parseFloat(job.payRate as string);
      const totalWagesOwed = Math.round(hoursWorked * payRate * 100) / 100;

      await updateApplication(input.applicationId, {
        checkOutAt: now,
        hoursWorked: String(hoursWorked),
        totalWagesOwed: String(totalWagesOwed),
        status: "completed",
      });

      // Mark job as completed
      await updateJob(app.jobId, { status: "completed" });

      notifyOwner({
        title: "ShiftChef: Shift Completed",
        content: `${job.role} shift at ${job.restaurantName ?? "restaurant"} completed. ${hoursWorked}h worked, $${totalWagesOwed} owed.`,
      }).catch(() => {});

      // SMS employer that worker clocked out with hours + total owed
      const worker = await getUserById(ctx.user.id);
      const employer = await getUserById(app.employerId);
      smsWorkerCheckedOut({
        employerPhone: employer?.phone,
        workerName: worker?.name ?? "Your worker",
        role: job.role,
        restaurantName: job.restaurantName,
        hoursWorked,
        totalOwed: totalWagesOwed,
      }).catch(() => {});

      return { success: true, checkOutAt: now, hoursWorked, totalWagesOwed };
    }),

  // Employer: mark shift started
  markStarted: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const app = await getApplicationById(input.applicationId);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });
      if (app.employerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      const now = Date.now();
      await updateApplication(input.applicationId, { shiftStartedAt: now });
      return { success: true, shiftStartedAt: now };
    }),

  // Employer: mark shift ended
  markEnded: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const app = await getApplicationById(input.applicationId);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });
      if (app.employerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      const job = await getJobById(app.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });

      const now = Date.now();
      const startMs = app.shiftStartedAt ? Number(app.shiftStartedAt) : (app.checkInAt ? Number(app.checkInAt) : Number(job.startTime));
      const hoursWorked = Math.round(((now - startMs) / 3_600_000) * 100) / 100;
      const payRate = parseFloat(job.payRate as string);
      const totalWagesOwed = Math.round(hoursWorked * payRate * 100) / 100;

      await updateApplication(input.applicationId, {
        shiftEndedAt: now,
        hoursWorked: String(hoursWorked),
        totalWagesOwed: String(totalWagesOwed),
        status: "completed",
      });
      await updateJob(app.jobId, { status: "completed" });

      return { success: true, shiftEndedAt: now, hoursWorked, totalWagesOwed };
    }),

  // Get shift status for a worker's application
  status: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const app = await getApplicationById(input.applicationId);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });
      if (app.workerId !== ctx.user.id && app.employerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const job = await getJobById(app.jobId);
      return {
        app,
        job,
        canCheckIn: app.status === "accepted" && !app.checkInAt,
        canClockOut: !!app.checkInAt && !app.checkOutAt,
        isComplete: app.status === "completed",
      };
    }),
});
