import type { Express } from "express";
import { getDb } from "../db";
import { users, jobs } from "../../drizzle/schema";

const SEED_SECRET = process.env.SEED_SECRET || "shiftchef_seed_2026";

const NOW = Date.now();
const DAY = 24 * 60 * 60 * 1000;

// ── Sample Employers ──────────────────────────────────────────────────────────
const EMPLOYERS = [
  {
    openId: "seed:employer:vegas_001",
    name: "Marco Vitale",
    email: "marco@bellagiostaff.com",
    phone: "+17025550101",
    loginMethod: "phone",
    userType: "employer" as const,
    city: "Las Vegas, NV",
    location: "3600 S Las Vegas Blvd, Las Vegas, NV 89109",
    profileComplete: true,
    postsRemaining: 10,
    subscriptionStatus: "active" as const,
  },
  {
    openId: "seed:employer:austin_001",
    name: "Sofia Reyes",
    email: "sofia@lacanteriaatx.com",
    phone: "+15125550202",
    loginMethod: "phone",
    userType: "employer" as const,
    city: "Austin, TX",
    location: "1801 S Congress Ave, Austin, TX 78704",
    profileComplete: true,
    postsRemaining: 10,
    subscriptionStatus: "active" as const,
  },
];

// ── Sample Workers ────────────────────────────────────────────────────────────
const WORKERS = [
  {
    openId: "seed:worker:001",
    name: "Darius Washington",
    email: "darius.w@gmail.com",
    phone: "+15125550301",
    loginMethod: "phone",
    userType: "worker" as const,
    city: "Austin, TX",
    location: "Austin, TX",
    specialty: "sous_chef",
    skills: JSON.stringify(["sous_chef", "cook", "prep"]),
    experience: JSON.stringify([
      { place: "Uchi Austin", role: "Sous Chef" },
      { place: "Odd Duck", role: "Line Cook" },
    ]),
    yearsExperience: 7,
    rating: 4.9,
    reliabilityScore: 98.0,
    totalRatings: 34,
    bio: "Sous chef with 7 years in Austin's top kitchens. Specialize in Japanese-influenced cuisine and high-volume service. Available for weekend and evening shifts.",
    profileComplete: true,
    verificationStatus: "verified" as const,
    contractSigned: true,
    stripeOnboardingComplete: true,
    stripeAccountId: "acct_sim_darius001",
  },
  {
    openId: "seed:worker:002",
    name: "Maria Gonzalez",
    email: "maria.g.chef@gmail.com",
    phone: "+15125550302",
    loginMethod: "phone",
    userType: "worker" as const,
    city: "Austin, TX",
    location: "Austin, TX",
    specialty: "cook",
    skills: JSON.stringify(["cook", "prep", "dishwasher"]),
    experience: JSON.stringify([
      { place: "Torchy's Tacos", role: "Line Cook" },
      { place: "Veracruz All Natural", role: "Cook" },
    ]),
    yearsExperience: 4,
    rating: 4.8,
    reliabilityScore: 96.0,
    totalRatings: 22,
    bio: "Experienced line cook specializing in Tex-Mex and Mexican cuisine. Fast, reliable, and great under pressure. Picking up gigs around Austin to supplement income.",
    profileComplete: true,
    verificationStatus: "verified" as const,
    contractSigned: true,
    stripeOnboardingComplete: true,
    stripeAccountId: "acct_sim_maria002",
  },
  {
    openId: "seed:worker:003",
    name: "James Tran",
    email: "jamestran.chef@gmail.com",
    phone: "+17025550303",
    loginMethod: "phone",
    userType: "worker" as const,
    city: "Las Vegas, NV",
    location: "Las Vegas, NV",
    specialty: "bartender",
    skills: JSON.stringify(["bartender", "server", "host"]),
    experience: JSON.stringify([
      { place: "Wynn Las Vegas", role: "Bartender" },
      { place: "Nobu Las Vegas", role: "Bar Lead" },
    ]),
    yearsExperience: 9,
    rating: 4.95,
    reliabilityScore: 99.0,
    totalRatings: 61,
    bio: "High-volume bartender with 9 years on the Strip. Certified mixologist. Available for casino events, private parties, and restaurant shifts.",
    profileComplete: true,
    verificationStatus: "verified" as const,
    contractSigned: true,
    stripeOnboardingComplete: true,
    stripeAccountId: "acct_sim_james003",
  },
];

export function registerSeedRoute(app: Express) {
  app.post("/api/admin/seed", async (req, res) => {
    const { secret } = req.body;
    if (secret !== SEED_SECRET) {
      res.status(403).json({ error: "Invalid seed secret" });
      return;
    }

    try {
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      const results: string[] = [];

      // ── Insert employers ──────────────────────────────────────────────────
      const employerIds: number[] = [];
      for (const emp of EMPLOYERS) {
        try {
          await db.insert(users).ignore().values({
            ...emp,
            lastSignedIn: new Date(),
          } as any);
          const [inserted] = await db.select({ id: users.id }).from(users).where(
            (await import("drizzle-orm")).eq(users.openId, emp.openId)
          ).limit(1);
          if (inserted) {
            employerIds.push(inserted.id);
            results.push(`✅ Employer: ${emp.name} (id: ${inserted.id})`);
          }
        } catch (e: any) {
          results.push(`⚠️ Employer ${emp.name}: ${e.message}`);
        }
      }

      // ── Insert workers ────────────────────────────────────────────────────
      for (const worker of WORKERS) {
        try {
          await db.insert(users).ignore().values({
            ...worker,
            lastSignedIn: new Date(),
          } as any);
          results.push(`✅ Worker: ${worker.name}`);
        } catch (e: any) {
          results.push(`⚠️ Worker ${worker.name}: ${e.message}`);
        }
      }

      // ── Get employer IDs for job creation ─────────────────────────────────
      const [vegasEmp] = await db.select({ id: users.id }).from(users).where(
        (await import("drizzle-orm")).eq(users.openId, "seed:employer:vegas_001")
      ).limit(1);
      const [austinEmp] = await db.select({ id: users.id }).from(users).where(
        (await import("drizzle-orm")).eq(users.openId, "seed:employer:austin_001")
      ).limit(1);

      // ── Insert jobs ───────────────────────────────────────────────────────
      const SAMPLE_JOBS = [
        // Las Vegas job
        {
          employerId: vegasEmp?.id ?? 1,
          role: "bartender" as const,
          payRate: "52.00",
          startTime: NOW + 2 * DAY + 18 * 3600000, // 2 days from now, 6pm
          endTime: NOW + 2 * DAY + 26 * 3600000,   // 2am
          city: "Las Vegas, NV",
          location: "3600 S Las Vegas Blvd, Las Vegas, NV 89109",
          latitude: 36.1126,
          longitude: -115.1767,
          restaurantName: "Bellagio Banquets & Events",
          description: "High-volume bartender needed for a private event in the Bellagio ballroom. Must have Strip experience. Dress code: all black. Arrive 30 min early for setup.",
          contactName: "Marco Vitale",
          contactPhone: "+17025550101",
          minRating: 4.5,
          status: "live" as const,
          paymentStatus: "unpaid" as const,
          totalPay: "416.00",
        },
        // Austin job 1
        {
          employerId: austinEmp?.id ?? 2,
          role: "sous_chef" as const,
          payRate: "45.00",
          startTime: NOW + 1 * DAY + 14 * 3600000, // tomorrow, 2pm
          endTime: NOW + 1 * DAY + 22 * 3600000,   // 10pm
          city: "Austin, TX",
          location: "1801 S Congress Ave, Austin, TX 78704",
          latitude: 30.2500,
          longitude: -97.7500,
          restaurantName: "La Canteria ATX",
          description: "Sous chef needed for Saturday dinner service. Upscale Mexican kitchen, 80+ covers. Must know modern plating techniques. Experience with wood-fired cooking a plus.",
          contactName: "Sofia Reyes",
          contactPhone: "+15125550202",
          minRating: 4.0,
          status: "live" as const,
          paymentStatus: "unpaid" as const,
          totalPay: "360.00",
        },
        // Austin job 2
        {
          employerId: austinEmp?.id ?? 2,
          role: "cook" as const,
          payRate: "32.00",
          startTime: NOW + 3 * DAY + 10 * 3600000, // 3 days from now, 10am
          endTime: NOW + 3 * DAY + 18 * 3600000,   // 6pm
          city: "Austin, TX",
          location: "2115 Allston Way, Austin, TX 78704",
          latitude: 30.2672,
          longitude: -97.7431,
          restaurantName: "South Congress Catering Co.",
          description: "Line cook needed for a corporate catering event — 200 guests. Prep starts at 10am, service at noon. Tex-Mex menu. Reliable and fast-paced. Daily pay after shift.",
          contactName: "Sofia Reyes",
          contactPhone: "+15125550202",
          minRating: 0,
          status: "live" as const,
          paymentStatus: "unpaid" as const,
          totalPay: "256.00",
        },
      ];

      for (const job of SAMPLE_JOBS) {
        try {
          await db.insert(jobs).values(job as any);
          results.push(`✅ Job: ${job.role} at ${job.restaurantName} (${job.city})`);
        } catch (e: any) {
          results.push(`⚠️ Job ${job.role} at ${job.restaurantName}: ${e.message}`);
        }
      }

      res.json({ success: true, results });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
