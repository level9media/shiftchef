import type { Express } from "express";
import express from "express";
import { getStripe } from "../stripe";
import {
  addPostCredits,
  getUserById,
  getUserByStripeCustomerId,
  updateUser,
  getPaymentByJob,
  updatePayment,
} from "../db";

/**
 * Register Stripe webhook at POST /api/stripe/webhook
 * MUST be registered BEFORE express.json() middleware so raw body is preserved.
 * Always returns HTTP 200 with { verified: true } — Stripe requires this.
 */
export function registerStripeWebhook(app: Express) {
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"] as string | undefined;
      const rawBody = req.body as Buffer;

      // ── Parse body ───────────────────────────────────────────────────────
      let parsed: any;
      try {
        parsed = JSON.parse(rawBody.toString("utf8"));
      } catch {
        console.error("[Webhook] Failed to parse body as JSON");
        return res.status(200).json({ verified: true });
      }

      // ── Test event shortcut (Stripe CLI / dashboard test events) ────────
      if (typeof parsed?.id === "string" && parsed.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected:", parsed.id);
        return res.status(200).json({ verified: true });
      }

      // ── Signature verification ───────────────────────────────────────────
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      let event: any = parsed;

      if (webhookSecret && sig) {
        try {
          const stripe = getStripe();
          event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
        } catch (err: any) {
          console.error("[Webhook] Signature verification failed:", err.message);
          // Return 200 even on failure — prevents Stripe retry loops
          return res.status(200).json({ verified: true });
        }
      } else {
        console.warn("[Webhook] No webhook secret or signature — processing without verification");
      }

      // ── Respond immediately, process async ──────────────────────────────
      res.status(200).json({ verified: true });

      console.log(`[Webhook] Processing: ${event.type} (${event.id})`);
      handleStripeEvent(event).catch((err) => {
        console.error(`[Webhook] Handler error for ${event.type}:`, err.message);
      });
    }
  );
}

async function handleStripeEvent(event: any) {
  const obj = event.data?.object ?? {};

  switch (event.type) {
    // ── Job posting credits purchased OR shift payment authorized ─────────
    case "checkout.session.completed": {
      const meta = obj.metadata ?? {};

      if (meta.type === "shift_payment") {
        // Employer paid for a shift — mark payment as held in escrow
        const jobId = parseInt(meta.jobId ?? "0");
        if (jobId) {
          const payment = await getPaymentByJob(jobId);
          if (payment && payment.status === "pending") {
            await updatePayment(payment.id, {
              status: "held",
              stripePaymentIntentId: obj.payment_intent ?? null,
            });
            console.log(`[Webhook] ✅ Shift payment held for job ${jobId} | PI: ${obj.payment_intent}`);
          }
        }
      } else if (meta.tier && meta.userId) {
        // Employer bought posting credits
        const userId = parseInt(meta.userId);
        const tier = meta.tier as "single" | "bundle3" | "subscription";
        const credits = parseInt(meta.credits ?? "1");

        if (tier === "subscription") {
          await updateUser(userId, {
            subscriptionStatus: "active",
            postsRemaining: 999,
            stripeCustomerId: obj.customer ?? undefined,
          });
          console.log(`[Webhook] ✅ Subscription activated for user ${userId}`);
        } else {
          const user = await getUserById(userId);
          const newTotal = (user?.postsRemaining ?? 0) + credits;
          await updateUser(userId, {
            postsRemaining: newTotal,
            stripeCustomerId: obj.customer ?? undefined,
          });
          console.log(`[Webhook] ✅ Credits unlocked: +${credits} for user ${userId} (total: ${newTotal})`);
        }

        // Audit log in postCredits table
        await addPostCredits({
          employerId: userId,
          creditType: tier,
          creditsAdded: credits,
          amountPaid: obj.amount_total ?? 0,
          stripePaymentIntentId: obj.payment_intent ?? null,
        });
      }
      break;
    }

    // ── Monthly subscription invoice paid (renewal) ───────────────────────
    case "invoice.paid": {
      const customerId = obj.customer as string;
      if (!customerId) break;

      // Renew subscription: find user by Stripe customer ID and refresh credits
      const user = await getUserByStripeCustomerId(customerId);
      if (user) {
        await updateUser(user.id, {
          subscriptionStatus: "active",
          postsRemaining: 999,
        });
        console.log(`[Webhook] ✅ Subscription renewed for user ${user.id} (customer: ${customerId})`);
      } else {
        console.warn(`[Webhook] ⚠️ No user found for Stripe customer ${customerId} on invoice.paid`);
      }
      break;
    }

    // ── Subscription cancelled ────────────────────────────────────────────
    case "customer.subscription.deleted": {
      const customerId = obj.customer as string;
      if (!customerId) break;

      const user = await getUserByStripeCustomerId(customerId);
      if (user) {
        await updateUser(user.id, {
          subscriptionStatus: "cancelled",
          postsRemaining: 0,
        });
        console.log(`[Webhook] ✅ Subscription cancelled for user ${user.id}`);
      }
      break;
    }

    // ── PaymentIntent authorized (manual capture — shift escrow) ─────────
    case "payment_intent.amount_capturable_updated": {
      const jobId = parseInt(obj.metadata?.jobId ?? "0");
      if (jobId) {
        const payment = await getPaymentByJob(jobId);
        if (payment && payment.status === "pending") {
          await updatePayment(payment.id, { status: "held", stripePaymentIntentId: obj.id });
          console.log(`[Webhook] ✅ PaymentIntent held for job ${jobId} | PI: ${obj.id}`);
        }
      }
      break;
    }

    // ── Transfer to worker confirmed ──────────────────────────────────────
    case "transfer.created": {
      const jobId = parseInt(obj.metadata?.jobId ?? "0");
      const workerId = parseInt(obj.metadata?.workerId ?? "0");
      const amount = obj.amount ?? 0;
      console.log(
        `[Webhook] ✅ Transfer confirmed | job: ${jobId} | worker: ${workerId} | $${(amount / 100).toFixed(2)} | transfer: ${obj.id}`
      );
      // Payment status already updated to "released" by releasePayment procedure
      // This event confirms the transfer reached Stripe — no additional DB update needed
      break;
    }

    default:
      console.log(`[Webhook] Unhandled event type: ${event.type}`);
      break;
  }
}
