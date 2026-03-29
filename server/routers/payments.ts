import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { notifyOwner } from "../_core/notification";
import {
  addPostCredits,
  createPayment,
  getJobById,
  getPaymentByJob,
  getPaymentById,
  getUserById,
  getWorkerPayments,
  updateJob,
  updatePayment,
  updateUser,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

// Pricing tiers (in cents)
const PRICING = {
  single: { amount: 3500, credits: 1, label: "Single Post" },
  bundle3: { amount: 7500, credits: 3, label: "3-Post Bundle" },
  subscription: { amount: 9900, credits: 999, label: "Monthly Unlimited" },
} as const;

export const paymentsRouter = router({
  // Employer: simulate paying for a job (escrow hold)
  // In production this would create a Stripe PaymentIntent
  payForJob: protectedProcedure
    .input(
      z.object({
        jobId: z.number(),
        // In production: stripePaymentMethodId would come from frontend
        simulateSuccess: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const job = await getJobById(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      if (job.employerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (job.paymentStatus === "held" || job.paymentStatus === "released") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Payment already made for this job" });
      }

      const totalPayCents = Math.round(parseFloat(job.totalPay ?? "0") * 100);
      if (totalPayCents <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid job pay amount" });

      const platformFee = Math.round(totalPayCents * 0.1);
      const workerPayout = totalPayCents - platformFee;

      // Simulate payment (in production: create Stripe PaymentIntent with capture_method=manual)
      const fakeIntentId = `pi_sim_${Date.now()}_${job.id}`;

      await createPayment({
        jobId: job.id,
        employerId: ctx.user.id,
        workerId: job.acceptedWorkerId ?? 0,
        amount: totalPayCents,
        platformFee,
        workerPayout,
        stripePaymentIntentId: fakeIntentId,
        status: "held",
        paidAt: new Date(),
      });

      await updateJob(job.id, {
        paymentStatus: "held",
        paymentIntentId: fakeIntentId,
      });

      return { success: true, amount: totalPayCents, platformFee, workerPayout };
    }),

  // Employer: release payment after shift completion
  releasePayment: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const job = await getJobById(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      if (job.employerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (job.status !== "completed") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Job must be marked completed first" });
      }

      const payment = await getPaymentByJob(input.jobId);
      if (!payment) throw new TRPCError({ code: "NOT_FOUND", message: "No payment found for this job" });
      if (payment.status === "released") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Payment already released" });
      }

      // In production: capture Stripe PaymentIntent + Transfer to worker's connected account
      await updatePayment(payment.id, {
        status: "released",
        releasedAt: new Date(),
      });

      await updateJob(job.id, { paymentStatus: "released" });

      // Credit worker's pending balance
      if (job.acceptedWorkerId) {
        const worker = await getUserById(job.acceptedWorkerId);
        if (worker) {
          await updateUser(job.acceptedWorkerId, {
            pendingBalance: (worker.pendingBalance ?? 0) + payment.workerPayout,
            totalEarned: (worker.totalEarned ?? 0) + payment.workerPayout,
          });
        }
      }

      // Notify owner of payment release
      notifyOwner({
        title: "ShiftChef: Payment Released",
        content: `Payment of $${(payment.workerPayout / 100).toFixed(2)} released for ${job.role} at ${job.restaurantName ?? "venue"}. Platform fee: $${(payment.platformFee / 100).toFixed(2)}.`,
      }).catch(() => {});

      return { success: true, workerPayout: payment.workerPayout, platformFee: payment.platformFee };
    }),

  // Worker: get earnings summary
  earnings: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });

    const allPayments = await getWorkerPayments(ctx.user.id);
    const released = allPayments.filter((p) => p.status === "released");
    const held = allPayments.filter((p) => p.status === "held");

    const totalEarned = released.reduce((sum, p) => sum + p.workerPayout, 0);
    const totalFees = released.reduce((sum, p) => sum + p.platformFee, 0);
    const pendingBalance = held.reduce((sum, p) => sum + p.workerPayout, 0);

    // Enrich with job data
    const history = await Promise.all(
      released.map(async (p) => {
        const job = await getJobById(p.jobId);
        return { ...p, job };
      })
    );

    return {
      pendingBalance,
      totalEarned,
      totalFees,
      availableBalance: user.pendingBalance ?? 0,
      history,
      stripeOnboardingComplete: user.stripeOnboardingComplete ?? false,
    };
  }),

  // Worker: simulate withdraw (in production: Stripe payout)
  withdraw: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });

    if (!user.stripeOnboardingComplete) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Please connect your Stripe account first" });
    }

    const balance = user.pendingBalance ?? 0;
    if (balance <= 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No balance available to withdraw" });
    }

    // In production: create Stripe Payout to connected account
    await updateUser(ctx.user.id, { pendingBalance: 0 });

    return { success: true, amount: balance };
  }),

  // Employer: purchase posting credits
  purchaseCredits: protectedProcedure
    .input(z.object({ tier: z.enum(["single", "bundle3", "subscription"]) }))
    .mutation(async ({ ctx, input }) => {
      const tier = PRICING[input.tier];
      const employer = await getUserById(ctx.user.id);
      if (!employer) throw new TRPCError({ code: "NOT_FOUND" });

      // In production: create Stripe PaymentIntent/Subscription
      // Simulate success
      const fakeIntentId = `pi_credits_${Date.now()}`;

      await addPostCredits({
        employerId: ctx.user.id,
        creditType: input.tier,
        creditsAdded: tier.credits,
        amountPaid: tier.amount,
        stripePaymentIntentId: fakeIntentId,
      });

      if (input.tier === "subscription") {
        await updateUser(ctx.user.id, {
          subscriptionStatus: "active",
          postsRemaining: 999,
        });
      } else {
        await updateUser(ctx.user.id, {
          postsRemaining: (employer.postsRemaining ?? 0) + tier.credits,
        });
      }

      return { success: true, creditsAdded: tier.credits, amount: tier.amount };
    }),

  // Get pricing tiers
  pricingTiers: protectedProcedure.query(() => {
    return Object.entries(PRICING).map(([key, val]) => ({
      id: key,
      ...val,
    }));
  }),

  // Connect Stripe account (worker onboarding)
  connectStripe: protectedProcedure.mutation(async ({ ctx }) => {
    // In production: create Stripe Connect account + return onboarding URL
    // Simulate success for MVP
    await updateUser(ctx.user.id, {
      stripeAccountId: `acct_sim_${ctx.user.id}`,
      stripeOnboardingComplete: true,
    });
    return {
      success: true,
      message: "Stripe account connected (simulated for MVP)",
      onboardingUrl: null,
    };
  }),
});
