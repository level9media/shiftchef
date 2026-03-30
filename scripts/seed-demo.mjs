/**
 * Seed script: creates 20 demo job posts and 12 worker availability records
 * across Austin TX, Phoenix AZ, and Mesa AZ to provide marketplace liquidity.
 * Run: node scripts/seed-demo.mjs
 */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

const now = Date.now();
const EMPLOYER_ID = 1; // Rob's account (admin)

// ── Demo Jobs ─────────────────────────────────────────────────────────────────
const demoJobs = [
  // Austin TX — Tonight
  { role: "bartender", payRate: "28.00", city: "Austin, TX", location: "6th Street Bar & Grill, 601 E 6th St, Austin TX 78701", restaurantName: "6th Street Bar & Grill", description: "Busy Friday night bar shift. Must know classic cocktails.", isPermanent: false, startOffset: 3, hours: 5 },
  { role: "server", payRate: "22.00", city: "Austin, TX", location: "Uchi Austin, 801 S Lamar Blvd, Austin TX 78704", restaurantName: "Uchi Austin", description: "Upscale Japanese restaurant. Fine dining experience preferred.", isPermanent: true, startOffset: 4, hours: 6 },
  { role: "cook", payRate: "32.00", city: "Austin, TX", location: "Franklin Barbecue, 900 E 11th St, Austin TX 78702", restaurantName: "Franklin Barbecue", description: "Line cook for dinner rush. BBQ experience a plus.", isPermanent: false, startOffset: 2, hours: 7 },
  { role: "dishwasher", payRate: "18.00", city: "Austin, TX", location: "Torchy's Tacos HQ, 2801 Guadalupe St, Austin TX 78705", restaurantName: "Torchy's Tacos", description: "High-volume taco spot. Fast-paced team environment.", isPermanent: false, startOffset: 5, hours: 4 },
  { role: "sous_chef", payRate: "42.00", city: "Austin, TX", location: "Launderette, 2115 Holly St, Austin TX 78702", restaurantName: "Launderette", description: "Sous chef for weekend brunch service. Knife skills required.", isPermanent: true, startOffset: 8, hours: 8 },
  { role: "host", payRate: "19.00", city: "Austin, TX", location: "Aba Austin, 1011 S Congress Ave, Austin TX 78704", restaurantName: "Aba Austin", description: "Front-of-house host. Warm, professional demeanor required.", isPermanent: false, startOffset: 3, hours: 5 },
  { role: "manager", payRate: "45.00", city: "Austin, TX", location: "JW Marriott Austin, 110 E 2nd St, Austin TX 78701", restaurantName: "JW Marriott Austin", description: "Banquet floor manager for corporate event. 200+ guests.", isPermanent: true, startOffset: 6, hours: 9 },
  // Phoenix AZ
  { role: "bartender", payRate: "26.00", city: "Phoenix, AZ", location: "Bitter & Twisted Cocktail Parlour, 1 W Jefferson St, Phoenix AZ 85003", restaurantName: "Bitter & Twisted", description: "Craft cocktail bar downtown. Experience with spirits required.", isPermanent: false, startOffset: 4, hours: 6 },
  { role: "server", payRate: "21.00", city: "Phoenix, AZ", location: "Nobu Scottsdale, 7134 E Stetson Dr, Scottsdale AZ 85251", restaurantName: "Nobu Scottsdale", description: "Upscale server for dinner service. Japanese menu knowledge helpful.", isPermanent: true, startOffset: 5, hours: 5 },
  { role: "cook", payRate: "30.00", city: "Phoenix, AZ", location: "Pizzeria Bianco, 623 E Adams St, Phoenix AZ 85004", restaurantName: "Pizzeria Bianco", description: "Line cook for wood-fired pizza station. Fast-paced.", isPermanent: false, startOffset: 3, hours: 6 },
  { role: "prep", payRate: "20.00", city: "Phoenix, AZ", location: "The Larder + The Delta, 1 N 1st St, Phoenix AZ 85004", restaurantName: "The Larder + The Delta", description: "Prep cook for Southern-inspired kitchen. Morning shift.", isPermanent: false, startOffset: 10, hours: 5 },
  { role: "cleaner", payRate: "17.00", city: "Phoenix, AZ", location: "Arizona Biltmore, 2400 E Missouri Ave, Phoenix AZ 85016", restaurantName: "Arizona Biltmore", description: "Post-event cleanup crew. Banquet hall + kitchen.", isPermanent: false, startOffset: 7, hours: 4 },
  { role: "sous_chef", payRate: "40.00", city: "Phoenix, AZ", location: "Kai Restaurant, 5594 W Wild Horse Pass Blvd, Chandler AZ 85226", restaurantName: "Kai Restaurant", description: "AAA Five Diamond resort restaurant. Fine dining sous chef.", isPermanent: true, startOffset: 5, hours: 8 },
  // Mesa AZ
  { role: "server", payRate: "20.00", city: "Mesa, AZ", location: "Organ Stop Pizza, 1149 E Southern Ave, Mesa AZ 85204", restaurantName: "Organ Stop Pizza", description: "Family-style pizza restaurant. High-volume, fun atmosphere.", isPermanent: false, startOffset: 4, hours: 5 },
  { role: "bartender", payRate: "25.00", city: "Mesa, AZ", location: "Cider Corps, 1211 S Alma School Rd, Mesa AZ 85210", restaurantName: "Cider Corps", description: "Craft cider taproom bar. Knowledgeable, friendly staff.", isPermanent: true, startOffset: 3, hours: 6 },
  { role: "cook", payRate: "28.00", city: "Mesa, AZ", location: "Republica Empanada, 1 S Robson, Mesa AZ 85201", restaurantName: "Republica Empanada", description: "Latin kitchen cook. Empanada and grill station.", isPermanent: false, startOffset: 5, hours: 5 },
  { role: "dishwasher", payRate: "17.00", city: "Mesa, AZ", location: "Barro's Pizza, 1524 E Southern Ave, Mesa AZ 85204", restaurantName: "Barro's Pizza", description: "Busy pizza chain. Dishwasher for dinner rush.", isPermanent: false, startOffset: 2, hours: 4 },
  { role: "host", payRate: "18.00", city: "Mesa, AZ", location: "Rustler's Rooste, 7777 S Pointe Pkwy W, Phoenix AZ 85044", restaurantName: "Rustler's Rooste", description: "Western-themed steakhouse. Host for dinner service.", isPermanent: false, startOffset: 4, hours: 5 },
  { role: "manager", payRate: "43.00", city: "Mesa, AZ", location: "Sheraton Mesa Hotel, 200 N Centennial Way, Mesa AZ 85201", restaurantName: "Sheraton Mesa", description: "Banquet manager for weekend wedding reception.", isPermanent: true, startOffset: 6, hours: 8 },
  { role: "prep", payRate: "19.00", city: "Austin, TX", location: "Whole Foods Market HQ Cafe, 525 N Lamar Blvd, Austin TX 78703", restaurantName: "Whole Foods Cafe", description: "Prep cook for cafe kitchen. Healthy, fast-casual concept.", isPermanent: false, startOffset: 9, hours: 5 },
];

// ── Demo Worker Availability ───────────────────────────────────────────────────
const demoWorkers = [
  { city: "Austin, TX", roles: ["bartender", "server"], bio: "5 years bartending experience. Available nights and weekends.", rating: 4.8, name: "Marcus T." },
  { city: "Austin, TX", roles: ["cook", "prep"], bio: "Culinary school grad. Line cook experience at 3 Austin restaurants.", rating: 4.9, name: "Sofia R." },
  { city: "Austin, TX", roles: ["server", "host"], bio: "Fine dining server. 4 years at upscale Austin restaurants.", rating: 4.7, name: "James K." },
  { city: "Austin, TX", roles: ["sous_chef", "cook"], bio: "Sous chef with 7 years experience. Available for events.", rating: 5.0, name: "Elena M." },
  { city: "Phoenix, AZ", roles: ["bartender", "server"], bio: "Craft cocktail specialist. 6 years in Phoenix bar scene.", rating: 4.8, name: "Diego V." },
  { city: "Phoenix, AZ", roles: ["cook", "dishwasher"], bio: "Reliable kitchen worker. Available immediately.", rating: 4.5, name: "Aisha B." },
  { city: "Phoenix, AZ", roles: ["server", "host"], bio: "Front-of-house pro. Upscale dining experience.", rating: 4.9, name: "Tyler H." },
  { city: "Phoenix, AZ", roles: ["sous_chef", "manager"], bio: "Kitchen manager with 10 years experience. Events specialist.", rating: 4.7, name: "Priya N." },
  { city: "Mesa, AZ", roles: ["bartender", "server"], bio: "Energetic bartender. Great with crowds.", rating: 4.6, name: "Carlos F." },
  { city: "Mesa, AZ", roles: ["cook", "prep"], bio: "Experienced line cook. Latin and American cuisine.", rating: 4.8, name: "Hannah L." },
  { city: "Mesa, AZ", roles: ["server", "host"], bio: "Friendly, professional server. Available weekends.", rating: 4.7, name: "Kenji W." },
  { city: "Austin, TX", roles: ["cleaner", "dishwasher"], bio: "Reliable and fast. Available any shift.", rating: 4.4, name: "Destiny C." },
];

async function seed() {
  console.log("Seeding demo jobs...");
  for (const job of demoJobs) {
    const startTime = now + job.startOffset * 60 * 60 * 1000;
    const endTime = startTime + job.hours * 60 * 60 * 1000;
    const totalPay = (parseFloat(job.payRate) * job.hours).toFixed(2);
    await connection.execute(
      `INSERT INTO jobs (employerId, role, payRate, startTime, endTime, totalPay, city, location, description, isPermanent, restaurantName, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'live', NOW(), NOW())`,
      [EMPLOYER_ID, job.role, job.payRate, startTime, endTime, totalPay, job.city, job.location, job.description, job.isPermanent ? 1 : 0, job.restaurantName || null]
    );
  }
  console.log(`Inserted ${demoJobs.length} demo jobs.`);

  console.log("Seeding demo worker availability...");
  for (const w of demoWorkers) {
    // First create a demo user for this worker
    const [userResult] = await connection.execute(
      `INSERT INTO users (openId, name, email, userType, city, bio, rating, reliabilityScore, verificationStatus, subscriptionStatus, postsRemaining, profileComplete, createdAt, updatedAt)
       VALUES (?, ?, ?, 'worker', ?, ?, ?, 100, 'verified', 'none', 0, 1, NOW(), NOW())
       ON DUPLICATE KEY UPDATE name=VALUES(name)`,
      [`demo_worker_${w.name.replace(/\s/g, "_").toLowerCase()}`, w.name, `${w.name.replace(/\s/g, ".").toLowerCase()}@demo.shiftchef.co`, w.city, w.bio, w.rating]
    );
    const workerId = /** @type {any} */ (userResult).insertId || 0;
    if (workerId > 0) {
      const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days
      await connection.execute(
        `INSERT INTO availability (workerId, city, skills, note, isActive, expiresAt, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 1, ?, NOW(), NOW())`,
        [workerId, w.city, JSON.stringify(w.roles), w.bio, expiresAt]
      );
    }
  }
  console.log(`Inserted ${demoWorkers.length} demo worker profiles.`);

  await connection.end();
  console.log("Done. Seed complete.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
