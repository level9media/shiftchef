import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { COOKIE_NAME } from "@shared/const";

export const authRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    return ctx.user ?? null;
  }),
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    ctx.res.clearCookie(COOKIE_NAME, { path: "/" });
    return { success: true };
  }),
});
