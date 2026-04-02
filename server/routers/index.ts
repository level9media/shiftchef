import { router } from "../_core/trpc";
import { authRouter } from "./auth";
import { adminRouter } from "./admin";
import { applicationsRouter } from "./applications";
import { availabilityRouter } from "./availability";
import { contractRouter } from "./contract";
import { couponsRouter } from "./coupons";
import { employerDashboardRouter } from "./employerDashboard";
import { jobsRouter } from "./jobs";
import { onboardingRouter } from "./onboarding";
import { paymentsRouter } from "./payments";
import { profileRouter } from "./profile";
import { ratingsRouter } from "./ratings";
import { shiftsRouter } from "./shifts";
import { verificationRouter } from "./verification";

export const appRouter = router({
  auth: authRouter,
  admin: adminRouter,
  applications: applicationsRouter,
  availability: availabilityRouter,
  contract: contractRouter,
  coupons: couponsRouter,
  employerDashboard: employerDashboardRouter,
  jobs: jobsRouter,
  onboarding: onboardingRouter,
  payments: paymentsRouter,
  profile: profileRouter,
  ratings: ratingsRouter,
  shifts: shiftsRouter,
  verification: verificationRouter,
});

export type AppRouter = typeof appRouter;
