import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { notifyOwner } from "../_core/notification";
import {
  addPostCredits,
  createPayment,
  getJobById,
  getPaymentByJob,
  getUserById,
  getWorkerPayments,
  updateJob,
  updatePayment,
  updateUser,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { getStripe, STRIPE_PRODUCTS } from "../stripe";

const ALLOWED_ORIGINS = [
  "https://shiftchef.co",
  "https://www.shiftchef.co",
  "https://shiftchef-production.up.railway.app",
  "https://staffuphub-5xtewxhs.manus.space",
];

function sanitizeOrigin(origin: string): string {
  const clean = (origin ?? "").replace(/\/$/, "");
  if (clean.startsWith("http://localhost") || clean.startsWith("http://127.0.0.1")) return clean;
  return ALLOWED_ORIGINS.includes(clean) ? clean : "https://shiftchef.co";
}

export const paymentsRouter = router({
  // ── Employer: Create Stripe Checkout session for posting credits ──────────
  purchaseCredits: protectedProcedure
    .input(z.object({ tier: z.enum(["single", "bundle3", "subscription"]), origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const product = STRIPE_PRODUCTS[input.tier];
      const stripe = getStripe();
      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      let customerId = user.stripeCustomerId ?? undefined;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          metadata: { userId: String(ctx.user.id) },
        });
        customerId = customer.id;
        await updateUser(ctx.user.id, { stripeCustomerId: customerId });
      }

      if (input.tier === "subscription") {
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          customer: customerId,
          allow_promotion_codes: true,
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: { name: product.name, description: product.description },
                unit_amount: product.amount,
                recurring: { interval: "month" },
              },
              quantity: 1,
            },
          ],
          success_url: `${sanitizeOrigin(input.origin)}/post-job?credits=success&tier=${input.tier}`,
          cancel_url: `${sanitizeOrigin(input.origin)}/post-job?credits=cancelled`,
          client_reference_id: String(ctx.user.id),
          metadata: {
            userId: String(ctx.user.id),
            tier: input.tier,
            credits: String(product.credits),
            customer_email: user.email ?? "",
            customer_name: user.name ?? "",
          },
        });
        return { url: session.url!, sessionId: session.id };
      } else {
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          customer: customerId,
          allow_promotion_codes: true,
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: { name: product.name, description: product.description },
                unit_amount: product.amount,
              },
              quantity: 1,
            },
          ],
          success_url: `${sanitizeOrigin(input.origin)}/post-job?credits=success&tier=${input.tier}`,
          cancel_url: `${sanitizeOrigin(input.origin)}/post-job?credits=cancelled`,
          client_reference_id: String(ctx.user.id),
          metadata: {
            userId: String(ctx.user.id),
            tier: input.tier,
            credits: String(product.credits),
            customer_email: user.email ?? "",
            customer_name: user.name ?? "",
          },
        });
        return { url: session.url!, sessionId: session.id };
      }
    }),

  // ── Employer: Pay for a specific job (hold in escrow) ────────────────────
  payForJob: protectedProcedure
    .input(z.object({ jobId: z.number(), origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      const job = await getJobById(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      if (job.employerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await getPaymentByJob(input.jobId);
      if (existing && existing.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Payment already exists for this job" });
      }

      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      const startMs = Number(job.startTime);
      const endMs = Number(job.endTime);
      const hours = Math.max(1, (endMs - startMs) / 3600000);
      const totalCents = Math.round(Number(job.payRate) * hours * 100);
      const platformFeeCents = Math.round(totalCents * 0.1);
      const workerPayoutCents = totalCents - platformFeeCents;

      let customerId = user.stripeCustomerId ?? undefined;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          metadata: { userId: String(ctx.user.id) },
        });
        customerId = customer.id;
        await updateUser(ctx.user.id, { stripeCustomerId: customerId });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: customerId,
        allow_promotion_codes: false,
        payment_intent_data: {
          capture_method: "manual",
          metadata: { jobId: String(input.jobId), userId: String(ctx.user.id), type: "shift_payment" },
        },
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `ShiftChef Shift — ${job.role} at ${job.restaurantName ?? "venue"}`,
                description: `${new Date(job.startTime).toLocaleDateString()} · ${job.city}`,
              },
              unit_amount: totalCents,
            },
            quantity: 1,
          },
        ],
        success_url: `${sanitizeOrigin(input.origin)}/applications?payment=success&jobId=${input.jobId}`,
        cancel_url: `${sanitizeOrigin(input.origin)}/applications?payment=cancelled`,
        client_reference_id: String(ctx.user.id),
        metadata: {
          jobId: String(input.jobId),
          userId: String(ctx.user.id),
          type: "shift_payment",
          customer_email: user.email ?? "",
          customer_name: user.name ?? "",
        },
      });

      if (existing) {
        await updatePayment(existing.id, {
          stripePaymentIntentId: session.payment_intent as string ?? null,
          amount: totalCents,
          platformFee: platformFeeCents,
          workerPayout: workerPayoutCents,
          status: "pending",
        });
      } else {
        await createPayment({
          jobId: input.jobId,
          employerId: ctx.user.id,
          workerId: job.acceptedWorkerId ?? ctx.user.id,
          amount: totalCents,
          platformFee: platformFeeCents,
          workerPayout: workerPayoutCents,
          stripePaymentIntentId: null,
          status: "pending",
        });
      }

      return { url: session.url!, sessionId: session.id, amount: totalCents };
    }),

  // ── Employer: Accept worker + pay escrow in one step ─────────────────────
  acceptAndPay: protectedProcedure
    .input(z.object({ applicationId: z.number(), origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      const { getApplicationById } = await import("../db");
      const app = await getApplicationById(input.applicationId);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });
      if (app.employerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (app.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Application is no longer pending" });

      const job = await getJobById(app.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      if (job.status !== "live") throw new TRPCError({ code: "BAD_REQUEST", message: "Job is no longer available" });

      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      const startMs = Number(job.startTime);
      const endMs = Number(job.endTime);
      const hours = Math.max(1, (endMs - startMs) / 3600000);
      const totalCents = Math.round(Number(job.payRate) * hours * 100);
      const platformFeeCents = Math.round(totalCents * 0.1);
      const workerPayoutCents = totalCents - platformFeeCents;

      let customerId = user.stripeCustomerId ?? undefined;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          metadata: { userId: String(ctx.user.id) },
        });
        customerId = customer.id;
        await updateUser(ctx.user.id, { stripeCustomerId: customerId });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: customerId,
        allow_promotion_codes: false,
        payment_intent_data: {
          capture_method: "manual",
          metadata: {
            jobId: String(app.jobId),
            applicationId: String(input.applicationId),
            employerId: String(ctx.user.id),
            workerId: String(app.workerId),
            type: "shift_escrow",
          },
        },
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `ShiftChef — ${job.role} at ${job.restaurantName ?? "venue"}`,
                description: `${new Date(job.startTime).toLocaleDateString()} · ${job.city} · Escrow held until shift complete`,
              },
              unit_amount: totalCents,
            },
            quantity: 1,
          },
        ],
        success_url: `${sanitizeOrigin(input.origin)}/applications?escrow=success&jobId=${app.jobId}&appId=${input.applicationId}`,
        cancel_url: `${sanitizeOrigin(input.origin)}/applications?escrow=cancelled`,
        client_reference_id: String(ctx.user.id),
        metadata: {
          jobId: String(app.jobId),
          applicationId: String(input.applicationId),
          employerId: String(ctx.user.id),
          workerId: String(app.workerId),
          type: "shift_escrow",
          customer_email: user.email ?? "",
          customer_name: user.name ?? "",
        },
      });

      const existing = await getPaymentByJob(app.jobId);
      if (!existing) {
        await createPayment({
          jobId: app.jobId,
          employerId: ctx.user.id,
          workerId: app.workerId,
          amount: totalCents,
          platformFee: platformFeeCents,
          workerPayout: workerPayoutCents,
          stripePaymentIntentId: null,
          status: "pending",
        });
      }

      return { url: session.url!, sessionId: session.id, amount: totalCents };
    }),

  // ── Employer: Release payment after shift completion ──────────────────────
  releasePayment: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      const job = await getJobById(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      if (job.employerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      const payment = await getPaymentByJob(input.jobId);
      if (!payment) throw new TRPCError({ code: "NOT_FOUND", message: "No payment found" });
      if (payment.status === "released") throw new TRPCError({ code: "BAD_REQUEST", message: "Already released" });
      if (payment.status !== "held") throw new TRPCError({ code: "BAD_REQUEST", message: "Payment must be held before release" });

      if (payment.stripePaymentIntentId) {
        try {
          await stripe.paymentIntents.capture(payment.stripePaymentIntentId);
        } catch (err: any) {
          if (!err?.message?.includes("already captured")) throw err;
        }
      }

      const worker = await getUserById(payment.workerId);
      let transferSucceeded = true;
      if (worker?.stripeAccountId && !worker.stripeAccountId.startsWith("acct_sim_")) {
        try {
          const acct = await stripe.accounts.retrieve(worker.stripeAccountId);
          if (!acct.details_submitted || !acct.charges_enabled) {
            transferSucceeded = false;
          }
        } catch { transferSucceeded = false; }
      }
      if (transferSucceeded && worker?.stripeAccountId && !worker.stripeAccountId.startsWith("acct_sim_")) {
        try {
          await stripe.transfers.create({
            amount: payment.workerPayout,
            currency: "usd",
            destination: worker.stripeAccountId,
            transfer_group: `shift_${input.jobId}`,
            metadata: { jobId: String(input.jobId), workerId: String(payment.workerId) },
          });
        } catch (err: any) {
          console.error("[Stripe] Transfer failed:", err.message);
          transferSucceeded = false;
        }
      }

      await updatePayment(payment.id, { status: "released" });
      await updateJob(input.jobId, { status: "completed" });

      if (worker) {
        await updateUser(payment.workerId, {
          pendingBalance: (worker.pendingBalance ?? 0) + payment.workerPayout,
          totalEarned: (worker.totalEarned ?? 0) + payment.workerPayout,
        });
      }

      notifyOwner({
        title: "ShiftChef: Payment Released",
        content: `$${(payment.workerPayout / 100).toFixed(2)} released for ${job.role} at ${job.restaurantName ?? "venue"}. Platform fee: $${(payment.platformFee / 100).toFixed(2)}.`,
      }).catch(() => {});

      return { success: true, workerPayout: payment.workerPayout, platformFee: payment.platformFee, transferSucceeded };
    }),

  // ── Worker: Connect Stripe Express account ────────────────────────────────
  connectStripe: protectedProcedure
    .input(z.object({ origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      let accountId = user.stripeAccountId;
      if (!accountId || accountId.startsWith("acct_sim_")) {
        const account = await stripe.accounts.create({
          type: "express",
          email: user.email ?? undefined,
          capabilities: { transfers: { requested: true } },
          metadata: { userId: String(ctx.user.id) },
        });
        accountId = account.id;
        await updateUser(ctx.user.id, { stripeAccountId: accountId, stripeOnboardingComplete: false });
      }

      const link = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${sanitizeOrigin(input.origin)}/earnings?stripe=refresh`,
        return_url: `${sanitizeOrigin(input.origin)}/earnings?stripe=connected`,
        type: "account_onboarding",
      });

      return { success: true, onboardingUrl: link.url };
    }),

  // ── Worker: Check Stripe Connect status ──────────────────────────────────
  stripeStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });

    if (!user.stripeAccountId || user.stripeAccountId.startsWith("acct_sim_")) {
      return { connected: false, onboardingComplete: false };
    }

    try {
      const stripe = getStripe();
      const account = await stripe.accounts.retrieve(user.stripeAccountId);
      const complete = account.details_submitted && account.charges_enabled;
      if (complete && !user.stripeOnboardingComplete) {
        await updateUser(ctx.user.id, { stripeOnboardingComplete: true });
      }
      return { connected: true, onboardingComplete: complete };
    } catch {
      return { connected: false, onboardingComplete: false };
    }
  }),

  // ── Worker: Earnings summary ──────────────────────────────────────────────
  earnings: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    const allPayments = await getWorkerPayments(ctx.user.id);
    const released = allPayments.filter((p) => p.status === "released");
    const held = allPayments.filter((p) => p.status === "held");
    const totalEarned = released.reduce((sum, p) => sum + p.workerPayout, 0);
    const totalFees = released.reduce((sum, p) => sum + p.platformFee, 0);
    const pendingBalance = held.reduce((sum, p) => sum + p.workerPayout, 0);
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
      stripeAccountId: user.stripeAccountId ?? null,
    };
  }),

  // ── Worker: Withdraw ──────────────────────────────────────────────────────
  withdraw: protectedProcedure.mutation(async ({ ctx }) => {
    const stripe = getStripe();
    const user = await getUserById(ctx.user.id);
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    if (!user.stripeOnboardingComplete) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Please connect your Stripe account first to receive payouts" });
    }
    const balance = user.pendingBalance ?? 0;
    if (balance <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "No balance available to withdraw" });

    if (user.stripeAccountId && !user.stripeAccountId.startsWith("acct_sim_")) {
      try {
        await stripe.transfers.create({
          amount: balance,
          currency: "usd",
          destination: user.stripeAccountId,
          metadata: { userId: String(ctx.user.id), type: "manual_withdraw" },
        });
        await updateUser(ctx.user.id, { pendingBalance: 0 });
        return { success: true, amount: balance, method: "stripe_transfer" };
      } catch (err: any) {
        console.error("[Stripe] Withdraw transfer failed:", err.message);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Payout failed — please try again or contact support" });
      }
    }
    await updateUser(ctx.user.id, { pendingBalance: 0 });
    return { success: true, amount: balance, method: "express_auto" };
  }),

  // ── Worker: Get Stripe Express dashboard link ─────────────────────────────
  getExpressDashboardLink: protectedProcedure.mutation(async ({ ctx }) => {
    const stripe = getStripe();
    const user = await getUserById(ctx.user.id);
    if (!user?.stripeAccountId || user.stripeAccountId.startsWith("acct_sim_")) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No connected Stripe account" });
    }
    const loginLink = await stripe.accounts.createLoginLink(user.stripeAccountId);
    return { url: loginLink.url };
  }),

  // ── Pricing tiers ─────────────────────────────────────────────────────────
  pricingTiers: protectedProcedure.query(() => {
    return Object.entries(STRIPE_PRODUCTS).map(([key, val]) => ({
      id: key,
      name: val.name,
      description: val.description,
      amount: val.amount,
      credits: val.credits,
      mode: val.mode,
    }));
  }),

  // ── Employer: Pay worker after shift completes (Option A flow) ────────────
  payAfterShift: protectedProcedure
    .input(z.object({
      applicationId: z.number(),
      tipAmount: z.number().optional(),
      origin: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      const { getApplicationById } = await import("../db");
      const app = await getApplicationById(input.applicationId);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });
      if (app.employerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (app.status !== "completed") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Shift must be completed before payment" });
      }

      const job = await getJobById(app.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });

      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      const hoursWorked = parseFloat(app.hoursWorked ?? "0") || 0;
      const payRate = parseFloat(job.payRate as string);
      const baseWagesCents = Math.round(hoursWorked * payRate * 100);
      const tipCents = Math.round((input.tipAmount ?? 0) * 100);
      const totalCents = baseWagesCents + tipCents;
      const platformFeeCents = Math.round(baseWagesCents * 0.10);
      const workerPayoutCents = baseWagesCents - platformFeeCents + tipCents;

      let customerId = user.stripeCustomerId ?? undefined;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          metadata: { userId: String(ctx.user.id) },
        });
        customerId = customer.id;
        await updateUser(ctx.user.id, { stripeCustomerId: customerId });
      }

      const worker = await getUserById(app.workerId);
      const lineItems: any[] = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `ShiftChef — ${job.role} at ${job.restaurantName ?? "venue"}`,
              description: `${hoursWorked.toFixed(2)}h × $${payRate.toFixed(2)}/hr · Worker: ${worker?.name ?? "Worker"}`,
            },
            unit_amount: baseWagesCents,
          },
          quantity: 1,
        },
      ];

      if (tipCents > 0) {
        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: "Tip / Bonus",
              description: `Extra for ${worker?.name ?? "worker"}`,
            },
            unit_amount: tipCents,
          },
          quantity: 1,
        });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: customerId,
        line_items: lineItems,
        payment_intent_data: {
          metadata: {
            jobId: String(app.jobId),
            applicationId: String(input.applicationId),
            workerId: String(app.workerId),
            type: "post_shift_payment",
          },
        },
        success_url: `${sanitizeOrigin(input.origin)}/applications?paid=success&appId=${input.applicationId}`,
        cancel_url: `${sanitizeOrigin(input.origin)}/pay-shift/${input.applicationId}`,
        client_reference_id: String(ctx.user.id),
        metadata: {
          jobId: String(app.jobId),
          applicationId: String(input.applicationId),
          workerId: String(app.workerId),
          type: "post_shift_payment",
          customer_email: user.email ?? "",
        },
      });

      await createPayment({
        jobId: app.jobId,
        employerId: ctx.user.id,
        workerId: app.workerId,
        amount: totalCents,
        platformFee: platformFeeCents,
        workerPayout: workerPayoutCents,
        stripePaymentIntentId: null,
        status: "pending",
      });

      return { url: session.url!, sessionId: session.id, amount: totalCents };
    }),
});
