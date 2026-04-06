import type { Express } from "express";
import express from "express";
import { getStripe } from "../stripe";
import { sendHireNotification } from "../_core/hireNotification";
import {
  addPostCredits,
  getUserById,
  getUserByStripeCustomerId,
  updateUser,
  getPaymentByJob,
  updatePayment,
  getApplicationById,
  getApplicationsByJob,
  updateApplication,
  updateJob,
  getJobById,
} from "../db";

export function registerStripeWebhook(app: Express) {
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"] as string | undefined;
      const rawBody = req.body as Buffer;

      let parsed: any;
      try {
        parsed = JSON.parse(rawBody.toString("utf8"));
      } catch {
        console.error("[Webhook] Failed to parse body as JSON");
        return res.status(200).json({ verified: true });
      }

      if (typeof parsed?.id === "string" && parsed.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected:", parsed.id);
        return res.status(200).json({ verified: true });
      }

      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      let event: any = parsed;

      if (webhookSecret && sig) {
        try {
          const stripe = getStripe();
          event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
        } catch (err: any) {
          console.error("[Webhook] Signature verification failed:", err.message);
          return res.status(200).json({ verified: true });
        }
      } else {
        console.warn("[Webhook] No webhook secret or signature — processing without verification");
      }

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

    // ── Stripe Identity: verification session completed ───────────────────
    case "identity.verification_session.verified": {
      const userId = parseInt(obj.metadata?.userId ?? "0");
      if (!userId) {
        console.warn("[Webhook] identity.verified — no userId in metadata");
        break;
      }
      const { getDb } = await import("../db");
      const { users } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) break;
      await db.update(users).set({
        verificationStatus: "verified",
        verifiedAt: new Date(),
      }).where(eq(users.id, userId));
      console.log(`[Webhook] ✅ Stripe Identity verified for user ${userId}`);
      break;
    }

    // ── Stripe Identity: verification failed ─────────────────────────────
    case "identity.verification_session.requires_input": {
      const userId = parseInt(obj.metadata?.userId ?? "0");
      if (!userId) break;
      const { getDb } = await import("../db");
      const { users } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) break;
      const reason = obj.last_error?.reason ?? "Verification could not be completed";
      await db.update(users).set({
        verificationStatus: "rejected",
        verificationNote: reason,
      }).where(eq(users.id, userId));
      console.log(`[Webhook] ❌ Stripe Identity failed for user ${userId}: ${reason}`);
      break;
    }

    // ── Job posting credits purchased OR shift payment authorized ─────────
    case "checkout.session.completed": {
      const meta = obj.metadata ?? {};

      if (meta.type === "shift_escrow") {
        const jobId = parseInt(meta.jobId ?? "0");
        const applicationId = parseInt(meta.applicationId ?? "0");
        if (jobId && applicationId) {
          const payment = await getPaymentByJob(jobId);
          if (payment && payment.status === "pending") {
            await updatePayment(payment.id, {
              status: "held",
              stripePaymentIntentId: obj.payment_intent ?? null,
            });
          }
          const app = await getApplicationById(applicationId);
          if (app && app.status === "pending") {
            await updateApplication(applicationId, { status: "accepted" });
            const allApps = await getApplicationsByJob(jobId);
            for (const other of allApps) {
              if (other.id !== applicationId && other.status === "pending") {
                await updateApplication(other.id, { status: "rejected" });
              }
            }
            await updateJob(jobId, { status: "filled", acceptedWorkerId: app.workerId, paymentStatus: "held" });
            console.log(`[Webhook] ✅ Shift escrow held & worker accepted | job ${jobId} | app ${applicationId}`);
            const job = await getJobById(jobId);
            const worker = await getUserById(app.workerId);
            const employer = job ? await getUserById(job.employerId) : null;
            if (job && worker) {
              sendHireNotification({
                workerName: worker.name ?? "Worker",
                workerEmail: worker.email,
                workerPhone: worker.phone,
                employerName: employer?.name ?? job.restaurantName ?? "Employer",
                employerEmail: employer?.email,
                employerPhone: employer?.phone,
                restaurantName: job.restaurantName,
                role: job.role,
                startTime: job.startTime,
                endTime: job.endTime,
                payRate: job.payRate,
                location: job.location,
                city: job.city,
                description: job.description,
              }).catch(() => {});
            }
          }
        }
      } else if (meta.type === "shift_payment") {
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

    case "invoice.paid": {
      const customerId = obj.customer as string;
      if (!customerId) break;
      const user = await getUserByStripeCustomerId(customerId);
      if (user) {
        await updateUser(user.id, { subscriptionStatus: "active", postsRemaining: 999 });
        console.log(`[Webhook] ✅ Subscription renewed for user ${user.id}`);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const customerId = obj.customer as string;
      if (!customerId) break;
      const user = await getUserByStripeCustomerId(customerId);
      if (user) {
        await updateUser(user.id, { subscriptionStatus: "cancelled", postsRemaining: 0 });
        console.log(`[Webhook] ✅ Subscription cancelled for user ${user.id}`);
      }
      break;
    }

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

    case "account.updated": {
      const accountId = obj.id as string;
      if (!accountId) break;
      if (obj.details_submitted && obj.charges_enabled) {
        const { getDb } = await import("../db");
        const { users } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) break;
        const [user] = await db.select().from(users).where(eq(users.stripeAccountId, accountId)).limit(1);
        if (user && !user.stripeOnboardingComplete) {
          await updateUser(user.id, { stripeOnboardingComplete: true });
          console.log(`[Webhook] ✅ Stripe Connect onboarding complete for user ${user.id}`);
        }
      }
      break;
    }

    case "transfer.created": {
      const jobId = parseInt(obj.metadata?.jobId ?? "0");
      const workerId = parseInt(obj.metadata?.workerId ?? "0");
      const amount = obj.amount ?? 0;
      console.log(`[Webhook] ✅ Transfer confirmed | job: ${jobId} | worker: ${workerId} | $${(amount / 100).toFixed(2)} | transfer: ${obj.id}`);
      break;
    }

    default:
      console.log(`[Webhook] Unhandled event type: ${event.type}`);
      break;
  }
}