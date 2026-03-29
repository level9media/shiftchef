import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getUserById, updateUser } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const profileRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    return user;
  }),

  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const user = await getUserById(input.id);
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    // Return public profile only
    const { stripeAccountId, stripeCustomerId, subscriptionId, openId, ...pub } = user;
    return pub;
  }),

  setRole: protectedProcedure
    .input(z.object({ userType: z.enum(["worker", "employer", "both"]) }))
    .mutation(async ({ ctx, input }) => {
      await updateUser(ctx.user.id, { userType: input.userType });
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(128).optional(),
        bio: z.string().max(500).optional(),
        city: z.string().max(128).optional(),
        location: z.string().max(256).optional(),
        profileImage: z.string().url().optional(),
        skills: z.array(z.string()).optional(),
        experience: z.string().max(1000).optional(),
        restaurantName: z.string().max(256).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.bio !== undefined) updateData.bio = input.bio;
      if (input.city !== undefined) updateData.city = input.city;
      if (input.location !== undefined) updateData.location = input.location;
      if (input.profileImage !== undefined) updateData.profileImage = input.profileImage;
      if (input.skills !== undefined) updateData.skills = JSON.stringify(input.skills);
      if (input.experience !== undefined) updateData.experience = input.experience;
      updateData.profileComplete = true;
      await updateUser(ctx.user.id, updateData);
      return { success: true };
    }),
});
