/**
 * Auto-release payments 24 hours after worker clock-out.
 * Runs on a setInterval every 15 minutes on the server.
 * If the employer hasn't manually released payment within 24h of clock-out,
 * this job captures the held PaymentIntent and transfers funds to the worker.
 */
import { getDb } from "../db";
import { applications, jobs, payments, users } from "../../drizzle/schema";
import { eq, and, isNotNull, isNull, lt } from "drizzle-orm";
import { getStripe } from "../stripe";
import { notifyOwner } from "../_core/notification";
import { smsPaymentReleased } from "../_core/sms";

const AUTO_RELEASE_DELAY_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function runAutoReleasePayments() {
  const db = await getDb();
  if (!db) return;

  const now = Date.now();
  const cutoff = now - AUTO_RELEASE_DELAY_MS;

  // Find completed applications where:
  // - worker has clocked out (checkOutAt is set)
  // - clock-out was more than 24h ago
  // - payment is still in "held" status (not yet released)
  const completedApps = await db
    .select({
      appId: applications.id,
      jobId: applications.jobId,
      workerId: applications.workerId,
      checkOutAt: applications.checkOutAt,
    })
    .from(applications)
    .where(
      and(
        isNotNull(applications.checkOutAt),
        lt(applications.checkOutAt, cutoff),
        eq(applications.status, "completed")
      )
    );

  if (completedApps.length === 0) return;

  const stripe = getStripe();

  for (const app of completedApps) {
    try {
      // Check if payment is still held
      const [payment] = await db
        .select()
        .from(payments)
        .where(and(eq(payments.jobId, app.jobId), eq(payments.status, "held")))
        .limit(1);

      if (!payment) continue; // Already released or not found

      console.log(`[AutoRelease] Releasing payment for job ${app.jobId} | worker ${app.workerId} | checked out ${new Date(Number(app.checkOutAt)).toISOString()}`);

      // Capture the held PaymentIntent
      if (payment.stripePaymentIntentId) {
        try {
          await stripe.paymentIntents.capture(payment.stripePaymentIntentId);
        } catch (err: any) {
          if (!err?.message?.includes("already captured")) {
            console.error(`[AutoRelease] Capture failed for PI ${payment.stripePaymentIntentId}:`, err.message);
            continue;
          }
        }
      }

      // Transfer 90% to worker's connected Stripe account
      const [worker] = await db.select().from(users).where(eq(users.id, app.workerId)).limit(1);
      let transferSucceeded = false;

      if (worker?.stripeAccountId && !worker.stripeAccountId.startsWith("acct_sim_")) {
        try {
          const acct = await stripe.accounts.retrieve(worker.stripeAccountId);
          if (acct.details_submitted && acct.charges_enabled) {
            await stripe.transfers.create({
              amount: payment.workerPayout,
              currency: "usd",
              destination: worker.stripeAccountId,
              transfer_group: `shift_${app.jobId}`,
              metadata: { jobId: String(app.jobId), workerId: String(app.workerId), autoRelease: "true" },
            });
            transferSucceeded = true;
          }
        } catch (err: any) {
          console.error(`[AutoRelease] Transfer failed for worker ${app.workerId}:`, err.message);
        }
      }

      // Update payment status to released
      await db
        .update(payments)
        .set({ status: "released" })
        .where(eq(payments.id, payment.id));

      // Update job status
      await db
        .update(jobs)
        .set({ status: "completed" })
        .where(eq(jobs.id, app.jobId));

      // Credit worker's pendingBalance
      if (worker) {
        await db
          .update(users)
          .set({
            pendingBalance: (worker.pendingBalance ?? 0) + payment.workerPayout,
            totalEarned: (worker.totalEarned ?? 0) + payment.workerPayout,
          })
          .where(eq(users.id, app.workerId));
      }

      notifyOwner({
        title: "ShiftChef: Auto-Release Fired",
        content: `Payment auto-released for job ${app.jobId} | $${(payment.workerPayout / 100).toFixed(2)} to worker ${app.workerId}. Transfer: ${transferSucceeded ? "✅" : "⚠️ held in pendingBalance"}`,
      }).catch(() => {});

      // SMS worker that their payment has been released
      const [jobRow] = await db.select().from(jobs).where(eq(jobs.id, app.jobId)).limit(1);
      if (worker) {
        smsPaymentReleased({
          workerPhone: worker.phone,
          workerName: worker.name ?? "Worker",
          amount: payment.workerPayout / 100,
          restaurantName: jobRow?.restaurantName,
        }).catch(() => {});
      }

      console.log(`[AutoRelease] ✅ Released $${(payment.workerPayout / 100).toFixed(2)} for job ${app.jobId}`);
    } catch (err: any) {
      console.error(`[AutoRelease] Error processing app ${app.appId}:`, err.message);
    }
  }
}

/**
 * Start the auto-release background job.
 * Runs every 15 minutes.
 */
export function startAutoReleaseJob() {
  const INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
  console.log("[AutoRelease] Background job started — checking every 15 minutes");

  // Run once immediately on startup (catches any missed releases from restarts)
  runAutoReleasePayments().catch((err) => {
    console.error("[AutoRelease] Startup run failed:", err.message);
  });

  setInterval(() => {
    runAutoReleasePayments().catch((err) => {
      console.error("[AutoRelease] Interval run failed:", err.message);
    });
  }, INTERVAL_MS);
}
