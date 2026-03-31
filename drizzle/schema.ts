import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  bigint,
  float,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),

  // StaffUp-specific fields
  userType: mysqlEnum("userType", ["worker", "employer", "both"]).default("worker"),
  profileImage: text("profileImage"),
  bio: text("bio"),
  city: varchar("city", { length: 128 }).default("Austin, TX"),
  location: varchar("location", { length: 256 }),

  // Worker fields
  skills: text("skills"), // JSON array of roles
  experience: text("experience"), // JSON array: [{place: string, role: string}]
  yearsExperience: int("yearsExperience").default(0),
  specialty: varchar("specialty", { length: 128 }), // primary role/specialty
  rating: float("rating").default(5.0),
  reliabilityScore: float("reliabilityScore").default(100.0),
  totalRatings: int("totalRatings").default(0),

  // Stripe
  stripeAccountId: varchar("stripeAccountId", { length: 128 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeOnboardingComplete: boolean("stripeOnboardingComplete").default(false),

  // Employer subscription
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["none", "active", "cancelled"]).default("none"),
  subscriptionId: varchar("subscriptionId", { length: 128 }),
  postsRemaining: int("postsRemaining").default(0),

  // Earnings (in cents)
  pendingBalance: bigint("pendingBalance", { mode: "number" }).default(0),
  totalEarned: bigint("totalEarned", { mode: "number" }).default(0),

  profileComplete: boolean("profileComplete").default(false),

  // Identity Verification
  verificationStatus: mysqlEnum("verificationStatus", ["unverified", "pending", "verified", "rejected"]).default("unverified"),
  verificationIdUrl: text("verificationIdUrl"),
  verificationNote: text("verificationNote"),
  verifiedAt: timestamp("verifiedAt"),

  // 1099 Contractor Agreement
  contractSigned: boolean("contractSigned").default(false),
  contractSignedAt: timestamp("contractSignedAt"),
  contractIp: varchar("contractIp", { length: 64 }),

  // Worker payout info (encrypted at app layer)
  bankRoutingNumber: varchar("bankRoutingNumber", { length: 256 }), // stored encrypted
  bankAccountNumber: varchar("bankAccountNumber", { length: 256 }), // stored encrypted
  bankAccountType: mysqlEnum("bankAccountType", ["checking", "savings"]),
  bankAccountName: varchar("bankAccountName", { length: 256 }),
  // Preferred contact method for employers
  contactPreference: mysqlEnum("contactPreference", ["email", "phone"]).default("email"),
  phone: varchar("phone", { length: 32 }),

  // Employer Onboarding
  onboardingEmailSent: boolean("onboardingEmailSent").default(false),
  onboardingStep: int("onboardingStep").default(0),
  // Email drip sequence tracking
  email1SentAt: timestamp("email1SentAt"),
  email2SentAt: timestamp("email2SentAt"),
  email3SentAt: timestamp("email3SentAt"),
  // Advisor / lifetime access accounts
  freeLifetimeAccess: boolean("freeLifetimeAccess").default(false),
  freePostUsed: boolean("freePostUsed").default(false), // tracks if the free first post has been redeemed

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Jobs ─────────────────────────────────────────────────────────────────────
export const jobs = mysqlTable("jobs", {
  id: int("id").autoincrement().primaryKey(),
  employerId: int("employerId").notNull(),

  role: mysqlEnum("role", [
    "cook",
    "sous_chef",
    "prep",
    "dishwasher",
    "cleaner",
    "server",
    "bartender",
    "host",
    "manager",
  ]).notNull(),

  payRate: decimal("payRate", { precision: 8, scale: 2 }).notNull(), // per hour
  startTime: bigint("startTime", { mode: "number" }).notNull(), // UTC ms
  endTime: bigint("endTime", { mode: "number" }).notNull(),     // UTC ms
  totalPay: decimal("totalPay", { precision: 10, scale: 2 }),   // computed

  city: varchar("city", { length: 128 }).default("Austin, TX"),
  location: varchar("location", { length: 256 }),
  description: text("description"),

  minRating: float("minRating").default(0),
  isPermanent: boolean("isPermanent").default(false),

  restaurantName: varchar("restaurantName", { length: 256 }),
  restaurantImage: text("restaurantImage"),

  status: mysqlEnum("status", ["live", "filled", "completed", "expired", "cancelled"]).default("live"),

  acceptedWorkerId: int("acceptedWorkerId"),
  paymentIntentId: varchar("paymentIntentId", { length: 256 }),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "held", "released", "refunded"]).default("unpaid"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

// ─── Applications ─────────────────────────────────────────────────────────────
export const applications = mysqlTable("applications", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  workerId: int("workerId").notNull(),
  employerId: int("employerId").notNull(),

  status: mysqlEnum("status", ["pending", "accepted", "rejected", "completed", "cancelled"]).default("pending"),
  coverNote: text("coverNote"),

  // Shift tracking
  checkInAt: bigint("checkInAt", { mode: "number" }),      // worker checks in (UTC ms)
  checkOutAt: bigint("checkOutAt", { mode: "number" }),     // worker clocks out (UTC ms)
  shiftStartedAt: bigint("shiftStartedAt", { mode: "number" }), // employer marks started
  shiftEndedAt: bigint("shiftEndedAt", { mode: "number" }),     // employer marks ended
  hoursWorked: decimal("hoursWorked", { precision: 6, scale: 2 }), // computed
  totalWagesOwed: decimal("totalWagesOwed", { precision: 10, scale: 2 }), // computed
  payoutStatus: mysqlEnum("payoutStatus", ["unpaid", "processing", "paid", "failed"]).default("unpaid"),
  payoutMethod: mysqlEnum("payoutMethod", ["stripe_bank", "stripe_instant", "cash_app", "square"]),
  payoutAt: bigint("payoutAt", { mode: "number" }),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

// ─── Payments ─────────────────────────────────────────────────────────────────
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  employerId: int("employerId").notNull(),
  workerId: int("workerId").notNull(),

  amount: bigint("amount", { mode: "number" }).notNull(), // in cents
  platformFee: bigint("platformFee", { mode: "number" }).notNull(), // 10%
  workerPayout: bigint("workerPayout", { mode: "number" }).notNull(), // 90%

  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 256 }),
  stripeTransferId: varchar("stripeTransferId", { length: 256 }),

  status: mysqlEnum("status", ["pending", "held", "released", "refunded", "failed"]).default("pending"),

  paidAt: timestamp("paidAt"),
  releasedAt: timestamp("releasedAt"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ─── Ratings ──────────────────────────────────────────────────────────────────
export const ratings = mysqlTable("ratings", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  paymentId: int("paymentId").notNull(),
  fromUserId: int("fromUserId").notNull(),
  toUserId: int("toUserId").notNull(),

  score: int("score").notNull(), // 1-5
  comment: text("comment"),
  response: text("response"), // employer response to worker rating

  raterType: mysqlEnum("raterType", ["worker", "employer"]).notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Rating = typeof ratings.$inferSelect;
export type InsertRating = typeof ratings.$inferInsert;

// ─── Worker Availability Posts ─────────────────────────────────────────────────
export const availability = mysqlTable("availability", {
  id: int("id").autoincrement().primaryKey(),
  workerId: int("workerId").notNull(),

  skills: text("skills").notNull(), // JSON array
  city: varchar("city", { length: 128 }).default("Austin, TX"),
  location: varchar("location", { length: 256 }),
  note: text("note"),
  isActive: boolean("isActive").default(true),

  expiresAt: bigint("expiresAt", { mode: "number" }), // UTC ms, null = no expiry

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Availability = typeof availability.$inferSelect;
export type InsertAvailability = typeof availability.$inferInsert;

// ─── Employer Post Credits ─────────────────────────────────────────────────────
export const postCredits = mysqlTable("postCredits", {
  id: int("id").autoincrement().primaryKey(),
  employerId: int("employerId").notNull(),

  creditType: mysqlEnum("creditType", ["single", "bundle3", "subscription"]).notNull(),
  creditsAdded: int("creditsAdded").notNull(),
  amountPaid: bigint("amountPaid", { mode: "number" }).notNull(), // cents
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 256 }),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PostCredit = typeof postCredits.$inferSelect;

// ─── Verification Requests ────────────────────────────────────────────────────
export const verificationRequests = mysqlTable("verificationRequests", {
  id: int("id").autoincrement().primaryKey(),
  workerId: int("workerId").notNull(),
  idImageUrl: text("idImageUrl").notNull(),
  selfieUrl: text("selfieUrl"),
  legalName: varchar("legalName", { length: 256 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending"),
  adminNote: text("adminNote"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VerificationRequest = typeof verificationRequests.$inferSelect;
export type InsertVerificationRequest = typeof verificationRequests.$inferInsert;

// ─── Email Logs ───────────────────────────────────────────────────────────────
export const emailLogs = mysqlTable("emailLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  emailStep: int("emailStep").notNull(), // 1, 2, or 3
  subject: varchar("subject", { length: 512 }).notNull(),
  status: mysqlEnum("status", ["sent", "failed", "scheduled"]).default("sent"),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  notes: text("notes"), // optional admin notes
});

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;

// ─── Coupons ──────────────────────────────────────────────────────────────────
export const coupons = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  type: mysqlEnum("type", ["free_post", "discount_percent", "discount_fixed"]).default("free_post"),
  value: int("value").default(1), // number of free posts, or % / cents off
  maxUses: int("maxUses").default(1),
  usedCount: int("usedCount").default(0),
  usedBy: int("usedBy"),       // userId of redeemer (for single-use)
  usedAt: timestamp("usedAt"),
  expiresAt: timestamp("expiresAt"),
  createdBy: int("createdBy"), // admin userId
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;
