import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { notifyOwner } from "../_core/notification";

// The 3-email drip sequence content (stored server-side for reference and preview)
export const ONBOARDING_EMAILS = [
  {
    step: 1,
    subject: "Welcome to ShiftChef — Your First Shift is 2 Hours Away",
    preview: "You're now connected to Austin's fastest-growing kitchen staffing platform.",
    body: `Hi {{name}},

Welcome to ShiftChef — the fastest way to fill kitchen shifts in Austin.

Here's how it works in 3 steps:
1. Post a job (takes 2 minutes) — pick the role, set your pay rate, and choose your shift time
2. Workers apply within minutes — you see their rating, experience, and reliability score
3. Accept the best fit — payment is held securely until the shift is complete

Your first post is on us. Use code FIRSTSHIFT at checkout for a free single post.

→ Post Your First Job Now: {{app_url}}/post-job

Questions? Reply to this email — we're real people in Austin.

— The ShiftChef Team`,
  },
  {
    step: 2,
    subject: "The $99/Month Math That Makes Restaurant Owners Smile",
    preview: "One no-show costs you $300+. Here's how to never deal with that again.",
    body: `Hi {{name}},

Quick question: how much does a no-show cost your restaurant?

Between the scramble to cover, the food waste, the stressed team, and the lost revenue — most operators tell us it's $300–500 per incident.

ShiftChef's $99/month unlimited plan means:
✓ Post as many shifts as you need, any time
✓ Access our full pool of verified Austin kitchen workers
✓ Fill shifts in under 2 hours on average
✓ Pay only after the shift is completed — no risk

One covered shift pays for the entire month.

→ Upgrade to Unlimited: {{app_url}}/post-job

Already posting? Here's how to get the most out of ShiftChef:
- Set a competitive pay rate (we recommend 10–15% above Craigslist rates for faster fills)
- Add a detailed description — workers apply faster when they know exactly what to expect
- Enable "Permanent Potential" to attract workers who want to grow with your team

— The ShiftChef Team`,
  },
  {
    step: 3,
    subject: "3 Austin Restaurant Operators Share What Changed",
    preview: "Real results from ShiftChef users in your city.",
    body: `Hi {{name}},

Three things we hear from Austin restaurant operators every week:

"We filled a Saturday dinner sous chef spot in 90 minutes." 
— East Austin bistro, 40 seats

"Our dishwasher called out at 4pm on a Friday. ShiftChef had someone there by 6pm."
— South Lamar bar & kitchen

"We hired two of our best line cooks through ShiftChef. Started as temp, went permanent."
— North Loop neighborhood restaurant

ShiftChef works because:
→ Workers are rated and reviewed by real employers (not self-reported)
→ Payment is held in escrow — you only pay after the shift is done
→ The 10% platform fee means we only make money when you make money

Ready to stop scrambling for coverage?

→ Post a Job Now: {{app_url}}/post-job
→ Go Unlimited for $99/mo: {{app_url}}/post-job

If there's anything we can do to help you get your first shift filled, reply to this email.

— Rob & The ShiftChef Team
Austin, TX`,
  },
];

export const onboardingRouter = router({
  // Get onboarding status and email sequence content
  status: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [user] = await db.select({
      onboardingStep: users.onboardingStep,
      onboardingEmailSent: users.onboardingEmailSent,
      userType: users.userType,
      name: users.name,
      email: users.email,
    }).from(users).where(eq(users.id, ctx.user.id)).limit(1);

    return {
      user: user ?? null,
      emails: ONBOARDING_EMAILS,
    };
  }),

  // Mark onboarding step complete
  completeStep: protectedProcedure
    .input(z.object({ step: z.number().min(0).max(10) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(users).set({
        onboardingStep: input.step,
      }).where(eq(users.id, ctx.user.id));

      return { success: true };
    }),

  // Dismiss onboarding (employer marks it done)
  dismiss: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    await db.update(users).set({
      onboardingStep: 99,
      onboardingEmailSent: true,
    }).where(eq(users.id, ctx.user.id));

    return { success: true };
  }),

  // Admin: get email sequence content for preview/editing
  getEmailSequence: protectedProcedure.query(({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    return ONBOARDING_EMAILS;
  }),

  // Trigger welcome notification when employer first signs up
  triggerWelcome: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user || user.onboardingEmailSent) return { success: true, alreadySent: true };

    await notifyOwner({
      title: "New Employer Signup — Send Welcome Email",
      content: `New employer registered: ${user.name || "Unknown"} (${user.email || "no email"}).
      
ACTION REQUIRED: Send Email #1 from the onboarding sequence:
Subject: "Welcome to ShiftChef — Your First Shift is 2 Hours Away"

Use promo code FIRSTSHIFT for their first free post.

Employer ID: ${user.id}
Signed up: ${new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })} CT`,
    });

    await db.update(users).set({
      onboardingEmailSent: true,
      onboardingStep: 1,
    }).where(eq(users.id, ctx.user.id));

    return { success: true, alreadySent: false };
  }),
});
