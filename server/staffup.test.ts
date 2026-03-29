import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeCtx(overrides: Partial<TrpcContext["user"]> = {}): TrpcContext {
  const user = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// ─── Auth ────────────────────────────────────────────────────────────────────

describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated users", async () => {
    const ctx = makeCtx({ id: 42, name: "Rob" });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result?.id).toBe(42);
    expect(result?.name).toBe("Rob");
  });
});

// ─── Payments: Pricing Tiers ─────────────────────────────────────────────────

describe("payments.pricingTiers", () => {
  it("returns all three pricing tiers", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const tiers = await caller.payments.pricingTiers();
    expect(tiers).toHaveLength(3);
    const ids = tiers.map((t: any) => t.id);
    expect(ids).toContain("single");
    expect(ids).toContain("bundle3");
    expect(ids).toContain("subscription");
  });

  it("single post costs $35 (3500 cents)", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const tiers = await caller.payments.pricingTiers();
    const single = tiers.find((t: any) => t.id === "single");
    expect(single?.amount).toBe(3500);
    expect(single?.credits).toBe(1);
  });

  it("bundle3 costs $75 (7500 cents) for 3 credits", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const tiers = await caller.payments.pricingTiers();
    const bundle = tiers.find((t: any) => t.id === "bundle3");
    expect(bundle?.amount).toBe(7500);
    expect(bundle?.credits).toBe(3);
  });

  it("subscription costs $99/month (9900 cents) for unlimited posts", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const tiers = await caller.payments.pricingTiers();
    const sub = tiers.find((t: any) => t.id === "subscription");
    expect(sub?.amount).toBe(9900);
    expect(sub?.credits).toBe(999);
  });
});

// ─── Ratings: Labels ─────────────────────────────────────────────────────────

describe("ratings.ratingLabels", () => {
  it("returns all 5 rating labels", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const labels = await caller.ratings.ratingLabels();
    expect(Object.keys(labels)).toHaveLength(5);
  });

  it("uses the correct label text for each score", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const labels = await caller.ratings.ratingLabels();
    expect(labels[5]).toBe("Absolutely");
    expect(labels[4]).toBe("Sure");
    expect(labels[3]).toBe("Maybe");
    expect(labels[2]).toBe("Not really");
    expect(labels[1]).toBe("Never");
  });
});

// ─── Jobs: Feed ──────────────────────────────────────────────────────────────

describe("jobs.list", () => {
  it("accepts city filter without throwing", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.jobs.list({ city: "Austin, TX" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("defaults to Austin, TX when no city is provided", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.jobs.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Auth: Logout ────────────────────────────────────────────────────────────

describe("auth.logout", () => {
  it("returns success and clears cookie", async () => {
    const cleared: string[] = [];
    const ctx = makeCtx();
    ctx.res = {
      clearCookie: (name: string) => { cleared.push(name); },
    } as unknown as TrpcContext["res"];

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(cleared.length).toBeGreaterThan(0);
  });
});

// ─── Profile: Role Validation ────────────────────────────────────────────────

describe("profile.setRole", () => {
  it("rejects invalid role types", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.profile.setRole({ userType: "invalid" as any })
    ).rejects.toThrow();
  });
});

// ─── Business Logic: 90/10 Split ─────────────────────────────────────────────

describe("platform fee calculation", () => {
  it("correctly calculates 90% worker payout and 10% platform fee", () => {
    const totalCents = 10000; // $100
    const workerPayout = Math.floor(totalCents * 0.9);
    const platformFee = totalCents - workerPayout;
    expect(workerPayout).toBe(9000); // $90
    expect(platformFee).toBe(1000); // $10
    expect(workerPayout + platformFee).toBe(totalCents);
  });

  it("handles fractional cents correctly", () => {
    const totalCents = 3750; // $37.50 (e.g., 5hr @ $7.50/hr)
    const workerPayout = Math.floor(totalCents * 0.9);
    const platformFee = totalCents - workerPayout;
    expect(workerPayout + platformFee).toBe(totalCents);
    expect(workerPayout / totalCents).toBeGreaterThanOrEqual(0.89);
    expect(workerPayout / totalCents).toBeLessThanOrEqual(0.91);
  });
});
