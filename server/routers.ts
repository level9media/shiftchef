import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { profileRouter } from "./routers/profile";
import { jobsRouter } from "./routers/jobs";
import { applicationsRouter } from "./routers/applications";
import { paymentsRouter } from "./routers/payments";
import { ratingsRouter } from "./routers/ratings";
import { availabilityRouter } from "./routers/availability";
import { adminRouter } from "./routers/admin";
import { verificationRouter } from "./routers/verification";
import { contractRouter } from "./routers/contract";
import { onboardingRouter } from "./routers/onboarding";
import { couponsRouter } from "./routers/coupons";
import { shiftsRouter } from "./routers/shifts";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  profile: profileRouter,
  jobs: jobsRouter,
  applications: applicationsRouter,
  payments: paymentsRouter,
  ratings: ratingsRouter,
  availability: availabilityRouter,
  admin: adminRouter,
  verification: verificationRouter,
  contract: contractRouter,
  onboarding: onboardingRouter,
  coupons: couponsRouter,
  shifts: shiftsRouter,
});

export type AppRouter = typeof appRouter;
