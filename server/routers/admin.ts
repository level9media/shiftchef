import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getAdminStats,
  getAdminRecentPayments,
  getAdminRecentUsers,
  getAdminRecentJobs,
  getUserById,
  getJobById,
} from "../db";

// Admin-only guard
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // Dashboard stats
  stats: adminProcedure.query(async () => {
    const stats = await getAdminStats();
    return stats;
  }),

  // Recent payments with enriched data
  recentPayments: adminProcedure.query(async () => {
    const payments = await getAdminRecentPayments(20);
    const enriched = await Promise.all(
      payments.map(async (p) => {
        const [job, worker, employer] = await Promise.all([
          getJobById(p.jobId),
          p.workerId ? getUserById(p.workerId) : null,
          getUserById(p.employerId),
        ]);
        return {
          ...p,
          job: job ? { id: job.id, role: job.role, restaurantName: job.restaurantName, city: job.city } : null,
          worker: worker ? { id: worker.id, name: worker.name } : null,
          employer: employer ? { id: employer.id, name: employer.name } : null,
        };
      })
    );
    return enriched;
  }),

  // Recent users
  recentUsers: adminProcedure.query(async () => {
    return getAdminRecentUsers(30);
  }),

  // Recent jobs
  recentJobs: adminProcedure.query(async () => {
    const jobs = await getAdminRecentJobs(20);
    const enriched = await Promise.all(
      jobs.map(async (j) => {
        const employer = await getUserById(j.employerId);
        return {
          ...j,
          employer: employer ? { id: employer.id, name: employer.name } : null,
        };
      })
    );
    return enriched;
  }),
});
