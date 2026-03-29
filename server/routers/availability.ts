import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createAvailability,
  deleteAvailability,
  getLiveAvailability,
  getWorkerAvailability,
  updateAvailability,
  getUserById,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const availabilityRouter = router({
  // Public: list available workers by city
  list: publicProcedure
    .input(z.object({ city: z.string().default("Austin, TX") }))
    .query(async ({ input }) => {
      const posts = await getLiveAvailability(input.city);
      // Enrich with worker data
      const enriched = await Promise.all(
        posts.map(async (post) => {
          const worker = await getUserById(post.workerId);
          if (!worker) return { ...post, worker: null };
          const { stripeAccountId, stripeCustomerId, subscriptionId, openId, ...pub } = worker;
          return { ...post, worker: pub };
        })
      );
      return enriched;
    }),

  // Worker: post availability
  post: protectedProcedure
    .input(
      z.object({
        skills: z.array(z.string()).min(1),
        city: z.string().default("Austin, TX"),
        location: z.string().max(256).optional(),
        note: z.string().max(500).optional(),
        expiresInHours: z.number().min(1).max(72).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const expiresAt = input.expiresInHours
        ? Date.now() + input.expiresInHours * 60 * 60 * 1000
        : null;

      await createAvailability({
        workerId: ctx.user.id,
        skills: JSON.stringify(input.skills),
        city: input.city,
        location: input.location,
        note: input.note,
        isActive: true,
        expiresAt: expiresAt ?? undefined,
      });

      return { success: true };
    }),

  // Worker: get their own availability posts
  mine: protectedProcedure.query(async ({ ctx }) => {
    return getWorkerAvailability(ctx.user.id);
  }),

  // Worker: deactivate availability post
  deactivate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const posts = await getWorkerAvailability(ctx.user.id);
      const post = posts.find((p) => p.id === input.id);
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      if (post.workerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await updateAvailability(input.id, { isActive: false });
      return { success: true };
    }),

  // Worker: delete availability post
  remove: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const posts = await getWorkerAvailability(ctx.user.id);
      const post = posts.find((p) => p.id === input.id);
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      if (post.workerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await deleteAvailability(input.id);
      return { success: true };
    }),
});
