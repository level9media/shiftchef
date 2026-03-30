import Stripe from "stripe";

// Singleton Stripe client — server-side only
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
  }
  return _stripe;
}

// ── Pricing Products ─────────────────────────────────────────────────────────
export const STRIPE_PRODUCTS = {
  single: {
    name: "ShiftChef — 1 Job Post",
    description: "Post a single shift on ShiftChef",
    amount: 3500, // $35.00 in cents
    credits: 1,
    mode: "payment" as const,
  },
  bundle3: {
    name: "ShiftChef — 3 Job Posts",
    description: "Post 3 shifts on ShiftChef (best value)",
    amount: 7500, // $75.00 in cents
    credits: 3,
    mode: "payment" as const,
  },
  subscription: {
    name: "ShiftChef — Unlimited Monthly",
    description: "Unlimited job posts + live feed access for 30 days",
    amount: 9900, // $99.00/month in cents
    credits: 999,
    mode: "subscription" as const,
  },
} as const;

export type PricingTier = keyof typeof STRIPE_PRODUCTS;
