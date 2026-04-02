import { and, desc, eq, gte, lt, lte, ne, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  applications,
  availability,
  coupons,
  InsertUser,
  jobs,
  payments,
  postCredits,
  ratings,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }

  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function updateUser(id: number, data: Partial<typeof users.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, id));
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export async function createJob(data: typeof jobs.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(jobs).values(data);
  return result[0];
}

export async function getJobById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return result[0];
}

export async function getLiveJobs(city: string) {
  const db = await getDb();
  if (!db) return [];
  const now = Date.now();
  await db
    .update(jobs)
    .set({ status: "expired" })
    .where(and(eq(jobs.status, "live"), lt(jobs.endTime, now)));

  return db
    .select()
    .from(jobs)
    .where(and(eq(jobs.status, "live"), eq(jobs.city, city), gte(jobs.endTime, now)))
    .orderBy(desc(jobs.createdAt));
}

export async function getEmployerJobs(employerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(jobs).where(eq(jobs.employerId, employerId)).orderBy(desc(jobs.createdAt));
}

export async function updateJob(id: number, data: Partial<typeof jobs.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(jobs).set(data).where(eq(jobs.id, id));
}

// ─── Applications ─────────────────────────────────────────────────────────────

export async function createApplication(data: typeof applications.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(applications).values(data);
  return result[0];
}

export async function getApplicationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  return result[0];
}

export async function getApplicationsByJob(jobId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(applications).where(eq(applications.jobId, jobId)).orderBy(desc(applications.createdAt));
}

export async function getApplicationsByWorker(workerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(applications).where(eq(applications.workerId, workerId)).orderBy(desc(applications.createdAt));
}

export async function getApplicationByJobAndWorker(jobId: number, workerId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(applications)
    .where(and(eq(applications.jobId, jobId), eq(applications.workerId, workerId)))
    .limit(1);
  return result[0];
}

export async function updateApplication(id: number, data: Partial<typeof applications.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(applications).set(data).where(eq(applications.id, id));
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function createPayment(data: typeof payments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(payments).values(data);
  return result[0];
}

export async function getPaymentByJob(jobId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(payments).where(eq(payments.jobId, jobId)).limit(1);
  return result[0];
}

export async function getPaymentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  return result[0];
}

export async function updatePayment(id: number, data: Partial<typeof payments.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(payments).set(data).where(eq(payments.id, id));
}

export async function getWorkerPayments(workerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payments).where(eq(payments.workerId, workerId)).orderBy(desc(payments.createdAt));
}

// ─── Ratings ──────────────────────────────────────────────────────────────────

export async function createRating(data: typeof ratings.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(ratings).values(data);
  return result[0];
}

export async function getRatingsByJob(jobId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ratings).where(eq(ratings.jobId, jobId));
}

export async function getRatingByJobAndRater(jobId: number, fromUserId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(ratings)
    .where(and(eq(ratings.jobId, jobId), eq(ratings.fromUserId, fromUserId)))
    .limit(1);
  return result[0];
}

export async function getRatingsForUser(toUserId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ratings).where(eq(ratings.toUserId, toUserId)).orderBy(desc(ratings.createdAt));
}

export async function updateRating(id: number, data: Partial<typeof ratings.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(ratings).set(data).where(eq(ratings.id, id));
}

// ─── Availability ─────────────────────────────────────────────────────────────

export async function createAvailability(data: typeof availability.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(availability).values(data);
  return result[0];
}

export async function getLiveAvailability(city: string) {
  const db = await getDb();
  if (!db) return [];
  const now = Date.now();
  return db
    .select()
    .from(availability)
    .where(
      and(
        eq(availability.city, city),
        eq(availability.isActive, true),
        or(sql`${availability.expiresAt} IS NULL`, gte(availability.expiresAt, now))
      )
    )
    .orderBy(desc(availability.createdAt));
}

export async function getWorkerAvailability(workerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(availability).where(eq(availability.workerId, workerId)).orderBy(desc(availability.createdAt));
}

export async function updateAvailability(id: number, data: Partial<typeof availability.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(availability).set(data).where(eq(availability.id, id));
}

export async function deleteAvailability(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(availability).where(eq(availability.id, id));
}

// ─── Post Credits ─────────────────────────────────────────────────────────────

export async function addPostCredits(data: typeof postCredits.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(postCredits).values(data);
}

export async function getEmployerPostCredits(employerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(postCredits).where(eq(postCredits.employerId, employerId)).orderBy(desc(postCredits.createdAt));
}

// ─── Admin Stats ──────────────────────────────────────────────────────────────

export async function getUserByStripeCustomerId(customerId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
  return result[0];
}

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return null;

  const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [totalJobs] = await db.select({ count: sql<number>`count(*)` }).from(jobs);
  const [activeJobs] = await db.select({ count: sql<number>`count(*)` }).from(jobs).where(eq(jobs.status, "live"));
  const [totalPayments] = await db.select({ count: sql<number>`count(*)`, total: sql<number>`sum(amount)` }).from(payments);
  const [releasedPayments] = await db.select({ total: sql<number>`sum(amount)`, fees: sql<number>`sum(platformFee)` }).from(payments).where(eq(payments.status, "released"));
  const [totalApplications] = await db.select({ count: sql<number>`count(*)` }).from(applications);
  const [ratingStats] = await db.select({ count: sql<number>`count(*)`, avg: sql<number>`avg(score)` }).from(ratings);

  return {
    totalUsers: Number(totalUsers?.count ?? 0),
    totalJobs: Number(totalJobs?.count ?? 0),
    activeJobs: Number(activeJobs?.count ?? 0),
    totalPayments: Number(totalPayments?.count ?? 0),
    totalVolume: Number(totalPayments?.total ?? 0),
    totalPlatformFees: Number(releasedPayments?.fees ?? 0),
    totalReleased: Number(releasedPayments?.total ?? 0),
    totalApplications: Number(totalApplications?.count ?? 0),
    totalRatings: Number(ratingStats?.count ?? 0),
    avgPlatformRating: ratingStats?.avg ? parseFloat(Number(ratingStats.avg).toFixed(2)) : null,
  };
}

export async function getAdminRecentPayments(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payments).orderBy(desc(payments.createdAt)).limit(limit);
}

export async function getAdminRecentUsers(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
  }).from(users).orderBy(desc(users.createdAt)).limit(limit);
}

export async function getAdminRecentJobs(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(jobs).orderBy(desc(jobs.createdAt)).limit(limit);
}

// ─── Coupons ──────────────────────────────────────────────────────────────────

export async function createCoupon(data: typeof coupons.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(coupons).values(data);
}

export async function getCouponByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select().from(coupons).where(eq(coupons.code, code.toUpperCase())).limit(1);
  return row;
}

export async function getAllCoupons(limit = 500) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coupons).orderBy(desc(coupons.createdAt)).limit(limit);
}

export async function updateCoupon(id: number, data: Partial<typeof coupons.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(coupons).set(data).where(eq(coupons.id, id));
}

export async function getAdminRecentRatings(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: ratings.id,
      score: ratings.score,
      comment: ratings.comment,
      createdAt: ratings.createdAt,
      fromUserId: ratings.fromUserId,
      toUserId: ratings.toUserId,
    })
    .from(ratings)
    .orderBy(desc(ratings.createdAt))
    .limit(limit);
  const enriched = await Promise.all(
    rows.map(async (r) => {
      const [from] = await db!.select({ name: users.name }).from(users).where(eq(users.id, r.fromUserId)).limit(1);
      const [to] = await db!.select({ name: users.name }).from(users).where(eq(users.id, r.toUserId)).limit(1);
      return { ...r, fromName: from?.name ?? "User", toName: to?.name ?? "User" };
    })
  );
  return enriched;
}

// ─── Activity Stats ───────────────────────────────────────────────────────────

export async function getActivityStats(city: string) {
  const db = await getDb();
  if (!db) return { recentJobsCount: 0, availableWorkersCount: 0 };
  const now = Date.now();
  const threeHoursAgoDate = new Date(now - 3 * 60 * 60 * 1000);

  const [jobRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(jobs)
    .where(
      and(
        eq(jobs.status, "live"),
        eq(jobs.city, city),
        gte(jobs.endTime, now),
        gte(jobs.createdAt, threeHoursAgoDate)
      )
    );

  const [workerRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(availability)
    .where(
      and(
        eq(availability.city, city),
        eq(availability.isActive, true),
        or(sql`${availability.expiresAt} IS NULL`, gte(availability.expiresAt, now))
      )
    );

  return {
    recentJobsCount: Number(jobRow?.count ?? 0),
    availableWorkersCount: Number(workerRow?.count ?? 0),
  };
}

// ─── Cancel overlapping applications ─────────────────────────────────────────

export async function cancelOverlappingApplications(
  workerId: number,
  startTime: number,
  endTime: number,
  excludeJobId: number
) {
  const db = await getDb();
  if (!db) return;
  const workerApps = await db
    .select()
    .from(applications)
    .where(and(eq(applications.workerId, workerId), eq(applications.status, "pending")));
  for (const app of workerApps) {
    if (app.jobId === excludeJobId) continue;
    const job = await getJobById(app.jobId);
    if (!job) continue;
    const overlaps = job.startTime < endTime && job.endTime > startTime;
    if (overlaps) await updateApplication(app.id, { status: "cancelled" });
  }
}

// ─── Email ────────────────────────────────────────────────────────────────────

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) { console.log(`[Email] To: ${to} | Subject: ${subject}`); return; }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "ShiftChef <notifications@shiftchef.co>", to, subject, html }),
    });
    if (!res.ok) console.warn(`[Email] Failed: ${res.status}`);
  } catch (err) {
    console.warn("[Email] Error:", err);
  }
}
