import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getUserById, updateUser } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

// Past job entry schema
const pastJobSchema = z.object({
  place: z.string().max(128),
  role: z.string().max(64),
});

export const profileRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    return user;
  }),

  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const user = await getUserById(input.id);
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    // Return public profile only — strip sensitive fields
    const { stripeAccountId, stripeCustomerId, subscriptionId, openId,
            bankRoutingNumber, bankAccountNumber, bankAccountName, contractIp, ...pub } = user;
    return pub;
  }),

  setRole: protectedProcedure
    .input(z.object({ userType: z.enum(["worker", "employer", "both"]) }))
    .mutation(async ({ ctx, input }) => {
      const currentUser = await getUserById(ctx.user.id);
      if (!currentUser) throw new TRPCError({ code: "NOT_FOUND" });

      const updateData: Record<string, unknown> = { userType: input.userType };

      const isBecomingEmployer =
        (input.userType === "employer" || input.userType === "both") &&
        currentUser.userType !== "employer" &&
        currentUser.userType !== "both";

      if (isBecomingEmployer && (currentUser.postsRemaining ?? 0) === 0) {
        updateData.postsRemaining = 1;
      }

      await updateUser(ctx.user.id, updateData);
      return { success: true, grantedFreePost: isBecomingEmployer };
    }),

  /**
   * Upload a profile photo from a base64 data URL.
   * Returns the CDN URL of the uploaded image.
   */
  uploadPhoto: protectedProcedure
    .input(
      z.object({
        dataUrl: z.string().max(10 * 1024 * 1024), // ~7.5MB base64 limit
        mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]).default("image/jpeg"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Strip the data URL prefix: "data:image/jpeg;base64,..."
      const base64 = input.dataUrl.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(base64, "base64");

      const ext = input.mimeType === "image/png" ? "png" : input.mimeType === "image/webp" ? "webp" : "jpg";
      const key = `profile-photos/${ctx.user.id}-${nanoid(8)}.${ext}`;

      const { url } = await storagePut(key, buffer, input.mimeType);

      // Save the URL to the user's profile
      await updateUser(ctx.user.id, { profileImage: url });

      return { url };
    }),

  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(128).optional(),
        bio: z.string().max(800).optional(),
        city: z.string().max(128).optional(),
        location: z.string().max(256).optional(),
        profileImage: z.string().url().optional(),
        skills: z.array(z.string()).optional(),
        // Rich experience fields
        yearsExperience: z.number().int().min(0).max(50).optional(),
        specialty: z.string().max(128).optional(),
        experience: z.array(pastJobSchema).optional(), // past jobs list
        // Contact/employer fields
        phone: z.string().max(32).optional(),
        contactPreference: z.enum(["email", "phone"]).optional(),
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
      if (input.yearsExperience !== undefined) updateData.yearsExperience = input.yearsExperience;
      if (input.specialty !== undefined) updateData.specialty = input.specialty;
      if (input.experience !== undefined) updateData.experience = JSON.stringify(input.experience);
      if (input.phone !== undefined) updateData.phone = input.phone;
      if (input.contactPreference !== undefined) updateData.contactPreference = input.contactPreference;
      updateData.profileComplete = true;
      await updateUser(ctx.user.id, updateData);
      return { success: true };
    }),
});
