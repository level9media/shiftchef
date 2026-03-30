import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createCoupon,
  getCouponByCode,
  getAllCoupons,
  updateCoupon,
  getUserById,
  updateUser,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

// Generate a random alphanumeric code
function generateCode(prefix = "SHIFT", length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusable chars
  let code = prefix + "-";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const couponsRouter = router({
  // Employer: redeem a coupon code at job posting
  redeem: protectedProcedure
    .input(z.object({ code: z.string().min(1).max(32) }))
    .mutation(async ({ ctx, input }) => {
      const coupon = await getCouponByCode(input.code.trim().toUpperCase());
      if (!coupon) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invalid coupon code" });
      }
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This coupon has expired" });
      }
      if (coupon.usedCount !== null && coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This coupon has already been used" });
      }
      // Single-use: check if this user already used it
      if (coupon.maxUses === 1 && coupon.usedBy !== null) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This coupon has already been redeemed" });
      }

      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      // Apply the coupon
      if (coupon.type === "free_post") {
        const creditsToAdd = coupon.value ?? 1;
        await updateUser(ctx.user.id, {
          postsRemaining: (user.postsRemaining ?? 0) + creditsToAdd,
        });
      }

      // Mark coupon as used
      await updateCoupon(coupon.id, {
        usedCount: (coupon.usedCount ?? 0) + 1,
        usedBy: ctx.user.id,
        usedAt: new Date(),
      });

      return {
        success: true,
        type: coupon.type,
        value: coupon.value,
        message:
          coupon.type === "free_post"
            ? `${coupon.value} free job post${(coupon.value ?? 1) > 1 ? "s" : ""} added to your account!`
            : "Coupon applied successfully!",
      };
    }),

  // Admin: generate a single coupon
  generate: protectedProcedure
    .input(
      z.object({
        type: z.enum(["free_post", "discount_percent", "discount_fixed"]).default("free_post"),
        value: z.number().int().min(1).default(1),
        maxUses: z.number().int().min(1).default(1),
        expiresAt: z.string().optional(), // ISO date string
        notes: z.string().optional(),
        prefix: z.string().max(8).default("SHIFT"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const code = generateCode(input.prefix);
      await createCoupon({
        code,
        type: input.type,
        value: input.value,
        maxUses: input.maxUses,
        usedCount: 0,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        notes: input.notes,
        createdBy: ctx.user.id,
      });
      return { code };
    }),

  // Admin: bulk generate up to 500 codes
  bulkGenerate: protectedProcedure
    .input(
      z.object({
        count: z.number().int().min(1).max(500),
        type: z.enum(["free_post", "discount_percent", "discount_fixed"]).default("free_post"),
        value: z.number().int().min(1).default(1),
        maxUses: z.number().int().min(1).default(1),
        expiresAt: z.string().optional(),
        notes: z.string().optional(),
        prefix: z.string().max(8).default("SHIFT"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const codes: string[] = [];
      const seen = new Set<string>();
      const expiresAt = input.expiresAt ? new Date(input.expiresAt) : undefined;

      for (let i = 0; i < input.count; i++) {
        let code: string;
        let attempts = 0;
        do {
          code = generateCode(input.prefix);
          attempts++;
        } while (seen.has(code) && attempts < 20);
        seen.add(code);
        codes.push(code);

        await createCoupon({
          code,
          type: input.type,
          value: input.value,
          maxUses: input.maxUses,
          usedCount: 0,
          expiresAt,
          notes: input.notes,
          createdBy: ctx.user.id,
        });
      }

      return { codes, count: codes.length };
    }),

  // Admin: list all coupons
  list: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getAllCoupons(input.limit);
    }),
});
