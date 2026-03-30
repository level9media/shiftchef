/**
 * ShiftChef — Austin TX Seed Script v3
 * Seeds 10 employer job posts + 10 worker availability posts
 * Uses exact DB schema column names and correct city format "Austin, TX"
 * Run: node scripts/seed-austin.mjs
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error("❌ DATABASE_URL not set"); process.exit(1); }

const conn = await mysql.createConnection(DB_URL);
console.log("✅ Connected to database");

const now = Date.now();
const HOUR = 3600000;
const DAY = 86400000;

// ── Clean up any previous seed data ──────────────────────────────────────────
await conn.execute("DELETE FROM availability WHERE workerId IN (SELECT id FROM users WHERE openId LIKE 'seed_%')");
await conn.execute("DELETE FROM jobs WHERE employerId IN (SELECT id FROM users WHERE openId LIKE 'seed_%')");
await conn.execute("DELETE FROM users WHERE openId LIKE 'seed_%'");
console.log("🧹 Cleared old seed data");

// ── Employer users ────────────────────────────────────────────────────────────
const employers = [
  { openId: "seed_emp_001", name: "Uchi Austin",           email: "jobs@uchiaustin.com",     city: "Austin, TX", location: "801 S Lamar Blvd, Austin, TX" },
  { openId: "seed_emp_002", name: "Franklin Barbecue",     email: "hiring@franklinbbq.com",  city: "Austin, TX", location: "900 E 11th St, Austin, TX" },
  { openId: "seed_emp_003", name: "Launderette",           email: "jobs@launderette.com",    city: "Austin, TX", location: "2115 Holly St, Austin, TX" },
  { openId: "seed_emp_004", name: "Odd Duck",              email: "hiring@oddduck.com",      city: "Austin, TX", location: "1201 S Lamar Blvd, Austin, TX" },
  { openId: "seed_emp_005", name: "Contigo Austin",        email: "jobs@contigoaustin.com",  city: "Austin, TX", location: "2027 Anchor Ln, Austin, TX" },
  { openId: "seed_emp_006", name: "Loro Asian Smokehouse", email: "hiring@loroaustin.com",   city: "Austin, TX", location: "2115 S Lamar Blvd, Austin, TX" },
  { openId: "seed_emp_007", name: "Emmer & Rye",           email: "jobs@emmerandrye.com",    city: "Austin, TX", location: "51 Rainey St, Austin, TX" },
  { openId: "seed_emp_008", name: "Fresa's Chicken",       email: "hiring@fresasaustin.com", city: "Austin, TX", location: "1703 S 1st St, Austin, TX" },
  { openId: "seed_emp_009", name: "Justine's Brasserie",   email: "jobs@justines.com",       city: "Austin, TX", location: "4710 E 5th St, Austin, TX" },
  { openId: "seed_emp_010", name: "Bufalina Pizza",        email: "hiring@bufalina.com",     city: "Austin, TX", location: "1519 E Cesar Chavez St, Austin, TX" },
];

const empIds = [];
for (const emp of employers) {
  const [r] = await conn.execute(
    `INSERT INTO users (openId, name, email, loginMethod, role, userType, city, location, postsRemaining, subscriptionStatus, profileComplete, createdAt, updatedAt, lastSignedIn)
     VALUES (?, ?, ?, 'seed', 'user', 'employer', ?, ?, 99, 'active', 1, NOW(), NOW(), NOW())`,
    [emp.openId, emp.name, emp.email, emp.city, emp.location]
  );
  empIds.push(r.insertId);
  console.log(`  ✅ Employer: ${emp.name} → id ${r.insertId}`);
}

// ── Job posts (bigint timestamps = Unix ms) ───────────────────────────────────
const jobPosts = [
  {
    empIdx: 0, role: "sous_chef", payRate: "28.00",
    startTime: now + DAY,           endTime: now + DAY + 8 * HOUR,
    city: "Austin, TX", location: "801 S Lamar Blvd, Austin, TX",
    restaurantName: "Uchi Austin",
    restaurantImage: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
    description: "Uchi Austin needs an experienced Sous Chef for Saturday dinner service. Japanese-influenced fine dining, high volume. Must have 3+ years fine dining experience, strong knife skills, and the ability to lead a line. Shift: 4pm–midnight. Strong potential to become permanent for the right candidate.",
    minRating: 4.0, isPermanent: 1,
  },
  {
    empIdx: 1, role: "prep", payRate: "18.00",
    startTime: now + 8 * HOUR,      endTime: now + 16 * HOUR,
    city: "Austin, TX", location: "900 E 11th St, Austin, TX",
    restaurantName: "Franklin Barbecue",
    restaurantImage: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&q=80",
    description: "Franklin Barbecue needs a prep cook for early morning shift. Duties: trimming brisket, prepping sides (coleslaw, beans, potato salad), keeping the prep kitchen clean. We start at 5am — this is a serious kitchen and we need someone who shows up on time, every time. Great pay, world-famous BBQ.",
    minRating: 3.0, isPermanent: 0,
  },
  {
    empIdx: 2, role: "cook", payRate: "22.00",
    startTime: now + 36 * HOUR,     endTime: now + 44 * HOUR,
    city: "Austin, TX", location: "2115 Holly St, Austin, TX",
    restaurantName: "Launderette",
    restaurantImage: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&q=80",
    description: "Launderette is seeking a line cook for weekend brunch service. Must be comfortable on sauté and grill stations. High-volume brunch with a focus on seasonal, locally sourced ingredients. Scratch cooking required. Brunch shift 9am–5pm Saturday. Strong potential to go permanent.",
    minRating: 3.0, isPermanent: 1,
  },
  {
    empIdx: 3, role: "dishwasher", payRate: "17.00",
    startTime: now + 12 * HOUR,     endTime: now + 20 * HOUR,
    city: "Austin, TX", location: "1201 S Lamar Blvd, Austin, TX",
    restaurantName: "Odd Duck",
    restaurantImage: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80",
    description: "Odd Duck needs a reliable dishwasher for Friday dinner service. Busy farm-to-table on South Lamar. Must be fast, clean, and able to keep up with a high-volume kitchen. Shift is 4pm–midnight. We tip out our dishwashers — you'll take home more than just hourly. Reliable people get called back every week.",
    minRating: 0.0, isPermanent: 0,
  },
  {
    empIdx: 4, role: "server", payRate: "15.00",
    startTime: now + 48 * HOUR,     endTime: now + 56 * HOUR,
    city: "Austin, TX", location: "2027 Anchor Ln, Austin, TX",
    restaurantName: "Contigo Austin",
    restaurantImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    description: "Contigo is hiring a server for Sunday brunch. Our patio restaurant in North Loop is known for its relaxed neighborhood vibe and excellent food. Servers make great tips — expect $30–45/hr total on a busy Sunday. Must have 2+ years fine dining or upscale casual experience. TABC certified preferred.",
    minRating: 3.0, isPermanent: 1,
  },
  {
    empIdx: 5, role: "cook", payRate: "20.00",
    startTime: now + 20 * HOUR,     endTime: now + 28 * HOUR,
    city: "Austin, TX", location: "2115 S Lamar Blvd, Austin, TX",
    restaurantName: "Loro Asian Smokehouse",
    restaurantImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    description: "Loro (Uchi + Aaron Franklin collab) needs a line cook for Thursday dinner. High-energy kitchen, Asian-influenced smoked meats concept. Must be comfortable on wok station and grill. We move fast and the food is incredible. If you're a cook who wants to work in one of Austin's most talked-about restaurants, this is your shot.",
    minRating: 3.0, isPermanent: 0,
  },
  {
    empIdx: 6, role: "sous_chef", payRate: "30.00",
    startTime: now + 72 * HOUR,     endTime: now + 82 * HOUR,
    city: "Austin, TX", location: "51 Rainey St, Austin, TX",
    restaurantName: "Emmer & Rye",
    restaurantImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
    description: "Emmer & Rye on Rainey Street is looking for a Sous Chef to cover a 10-hour Saturday dinner service. Michelin-recognized kitchen with a hyper-seasonal, grain-forward menu. Must have fine dining experience, be comfortable expediting, and have strong leadership skills. Pay is top of market. Could become a full-time role.",
    minRating: 4.0, isPermanent: 1,
  },
  {
    empIdx: 7, role: "cleaner", payRate: "16.00",
    startTime: now + 6 * HOUR,      endTime: now + 12 * HOUR,
    city: "Austin, TX", location: "1703 S 1st St, Austin, TX",
    restaurantName: "Fresa's Chicken",
    restaurantImage: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80",
    description: "Fresa's needs a kitchen cleaner for early morning deep clean before service. Duties: degreasing equipment, scrubbing floors, cleaning hood vents, sanitizing all prep surfaces. 6-hour shift starting at 6am. No experience necessary — just need someone reliable, thorough, and fast. Recurring work available for the right person.",
    minRating: 0.0, isPermanent: 0,
  },
  {
    empIdx: 8, role: "server", payRate: "14.00",
    startTime: now + 60 * HOUR,     endTime: now + 68 * HOUR,
    city: "Austin, TX", location: "4710 E 5th St, Austin, TX",
    restaurantName: "Justine's Brasserie",
    restaurantImage: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&q=80",
    description: "Justine's Brasserie — Austin's beloved late-night French bistro in East Austin — needs a server for Saturday night. Open until 2am, servers make exceptional tips on weekends. Must be comfortable with a full French brasserie menu, wine pairings, and an upscale-casual atmosphere. TABC required.",
    minRating: 3.0, isPermanent: 1,
  },
  {
    empIdx: 9, role: "prep", payRate: "17.50",
    startTime: now + 30 * HOUR,     endTime: now + 38 * HOUR,
    city: "Austin, TX", location: "1519 E Cesar Chavez St, Austin, TX",
    restaurantName: "Bufalina Pizza",
    restaurantImage: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
    description: "Bufalina, Austin's top Neapolitan pizza spot, needs a prep cook for Saturday morning. Duties: stretching and portioning dough, prepping toppings, making sauces, stocking the line. Must have kitchen experience. Small, tight team — reliability and speed matter more than a long resume. Consistent shifts available for good workers.",
    minRating: 2.0, isPermanent: 0,
  },
];

console.log("\n📝 Inserting job posts...");
for (const job of jobPosts) {
  const empId = empIds[job.empIdx];
  const [r] = await conn.execute(
    `INSERT INTO jobs (employerId, role, payRate, startTime, endTime, city, location, description, minRating, isPermanent, restaurantName, restaurantImage, status, paymentStatus, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'live', 'unpaid', NOW(), NOW())`,
    [empId, job.role, job.payRate, job.startTime, job.endTime, job.city, job.location, job.description, job.minRating, job.isPermanent, job.restaurantName, job.restaurantImage]
  );
  console.log(`  ✅ ${job.role} @ ${job.restaurantName} → id ${r.insertId}`);
}

// ── Worker users ──────────────────────────────────────────────────────────────
const workers = [
  { openId: "seed_wkr_001", name: "Marcus T.",   city: "Austin, TX", location: "East Austin, TX",          rating: 4.8, reliabilityScore: 95, skills: '["cook","sous_chef","prep"]',       experience: "8 years — Uchiko (3yr), Barley Swine (2yr), Lenoir (1yr). ServSafe certified.",                                                         bio: "Line cook with 8 years experience in Austin fine dining. Strong on sauté and grill. Looking for weekend shifts.", profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80" },
  { openId: "seed_wkr_002", name: "Daniela R.",  city: "Austin, TX", location: "South Congress, Austin, TX", rating: 4.9, reliabilityScore: 98, skills: '["server","bartender"]',              experience: "6 years — Uchiko FOH (2yr), Lenoir (2yr), Justine's Brasserie (2yr). TABC certified. Wine & Spirits Level 1.",                          bio: "Experienced server and bartender. 6 years in Austin's top restaurants. TABC certified, wine knowledge.", profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&q=80" },
  { openId: "seed_wkr_003", name: "Jamal W.",    city: "Austin, TX", location: "North Loop, Austin, TX",    rating: 4.5, reliabilityScore: 92, skills: '["sous_chef","cook","prep"]',          experience: "5 years — Emmer & Rye (2yr), Odd Duck (1yr), Launderette (1yr). Culinary Institute of America grad.",                                  bio: "Sous chef with fine dining background. Ran the line at Emmer & Rye for 2 years. Available for weekend and evening shifts.", profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80" },
  { openId: "seed_wkr_004", name: "Sofia M.",    city: "Austin, TX", location: "Bouldin Creek, Austin, TX", rating: 4.6, reliabilityScore: 96, skills: '["prep","cook","dishwasher"]',         experience: "4 years — Fresa's (2yr), Contigo (1yr), East Side King (1yr). Strong in vegetable prep and sauce work.",                               bio: "Prep cook and line cook. 4 years in Austin kitchens. Fast, clean, and reliable. Available mornings and afternoons.", profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80" },
  { openId: "seed_wkr_005", name: "Carlos V.",   city: "Austin, TX", location: "Cherrywood, Austin, TX",    rating: 4.4, reliabilityScore: 90, skills: '["dishwasher","cleaner","prep"]',      experience: "3 years — Franklin Barbecue (1yr), Loro (1yr), Bufalina (1yr). Known for speed and keeping a clean station.",                           bio: "Dishwasher and kitchen porter. 3 years experience. Fast, never calls out. Looking for consistent evening shifts.", profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80" },
  { openId: "seed_wkr_006", name: "Aisha K.",    city: "Austin, TX", location: "Hyde Park, Austin, TX",     rating: 5.0, reliabilityScore: 100, skills: '["sous_chef","cook","prep"]',         experience: "10+ years — NYC (Per Se staging, Gramercy Tavern), Austin (Barley Swine exec sous 3yr, Odd Duck 2yr). James Beard semifinalist team.", bio: "Professional chef with 10+ years. Specialize in modern American and farm-to-table. Available for high-end events and fill-in shifts.", profileImage: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80" },
  { openId: "seed_wkr_007", name: "Tyler B.",    city: "Austin, TX", location: "Rainey Street, Austin, TX", rating: 4.3, reliabilityScore: 88, skills: '["server","bartender"]',              experience: "5 years — Rainey Street bars (3yr), Contigo server (1yr), Justine's (1yr). TABC certified. Craft cocktail experience.",                bio: "Server and bartender. 5 years in Austin bars and restaurants. Great with high-volume service and craft cocktails.", profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80" },
  { openId: "seed_wkr_008", name: "Priya S.",    city: "Austin, TX", location: "Mueller, Austin, TX",       rating: 4.6, reliabilityScore: 94, skills: '["cook","prep","sous_chef"]',          experience: "4 years — Loro (2yr), Uchi (1yr), East Side King (1yr). Strong in Japanese and Southeast Asian techniques. Wok-certified.",             bio: "Line cook specializing in Asian cuisine. Comfortable on wok, grill, and sauté. Available evenings and weekends.", profileImage: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80" },
  { openId: "seed_wkr_009", name: "Devon H.",    city: "Austin, TX", location: "South Lamar, Austin, TX",   rating: 4.2, reliabilityScore: 85, skills: '["cleaner","dishwasher"]',             experience: "2 years — Multiple Austin restaurants. Experienced in deep cleaning, hood cleaning, floor scrubbing, and equipment sanitation.",          bio: "Kitchen cleaner and dishwasher. Reliable, fast, and thorough. Available early mornings and late nights. No drama, just work.", profileImage: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&q=80" },
  { openId: "seed_wkr_010", name: "Brianna L.",  city: "Austin, TX", location: "East Austin, TX",           rating: 4.8, reliabilityScore: 97, skills: '["server"]',                           experience: "7 years — Launderette (3yr), Emmer & Rye (2yr), Contigo (2yr). Sommelier Level 1. Known for upselling and guest satisfaction scores.", bio: "Experienced server with fine dining and brunch background. 7 years in Austin. TABC + food handler certified.", profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80" },
];

console.log("\n📝 Inserting worker accounts...");
const workerIds = [];
for (const w of workers) {
  const [r] = await conn.execute(
    `INSERT INTO users (openId, name, loginMethod, role, userType, city, location, skills, experience, bio, rating, reliabilityScore, totalRatings, profileComplete, profileImage, createdAt, updatedAt, lastSignedIn)
     VALUES (?, ?, 'seed', 'user', 'worker', ?, ?, ?, ?, ?, ?, ?, 12, 1, ?, NOW(), NOW(), NOW())`,
    [w.openId, w.name, w.city, w.location, w.skills, w.experience, w.bio, w.rating, w.reliabilityScore, w.profileImage]
  );
  workerIds.push(r.insertId);
  console.log(`  ✅ Worker: ${w.name} → id ${r.insertId}`);
}

// ── Availability posts ────────────────────────────────────────────────────────
const availPosts = [
  { wIdx: 0, skills: '["cook","sous_chef"]',      note: "Available for weekend dinner shifts. 8 years fine dining experience. Fast, clean, reliable. Worked Uchiko, Barley Swine. Hit me up." },
  { wIdx: 1, skills: '["server","bartender"]',    note: "Available NOW for lunch and dinner service. TABC certified, wine knowledge, 6 years experience. Can start same day." },
  { wIdx: 2, skills: '["sous_chef","cook"]',      note: "Sous chef available for weekend coverage. Fine dining background (Emmer & Rye). Can run a line, expedite, or work a station." },
  { wIdx: 3, skills: '["prep","cook"]',           note: "Available mornings and afternoons. Strong prep skills — veg butchery, sauce work, station setup. 4 years Austin kitchens." },
  { wIdx: 4, skills: '["dishwasher","cleaner"]',  note: "Available for evening and late-night shifts. Fast dishwasher, never calls out. Franklin BBQ and Loro on my resume." },
  { wIdx: 5, skills: '["sous_chef","cook"]',      note: "Executive-level chef available for high-end events and emergency kitchen coverage. 10+ years, NYC and Austin fine dining. Serious inquiries only." },
  { wIdx: 6, skills: '["server","bartender"]',    note: "Available for bar and server shifts. Craft cocktail experience, high-volume service. Rainey Street and fine dining background." },
  { wIdx: 7, skills: '["cook","prep"]',           note: "Line cook available evenings and weekends. Wok and grill specialist. Loro and Uchi experience. Can pick up shifts on short notice." },
  { wIdx: 8, skills: '["cleaner","dishwasher"]',  note: "Available for early morning deep cleans and late-night dish. No drama, just work. Reliable and fast. Text anytime." },
  { wIdx: 9, skills: '["server"]',               note: "Fine dining server available for brunch and dinner. Launderette and Emmer & Rye background. Sommelier Level 1. TABC certified." },
];

console.log("\n📝 Inserting availability posts...");
const expiresAt = now + 7 * DAY;
for (const post of availPosts) {
  const wId = workerIds[post.wIdx];
  const w = workers[post.wIdx];
  const [r] = await conn.execute(
    `INSERT INTO availability (workerId, skills, city, location, note, isActive, expiresAt, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, 1, ?, NOW(), NOW())`,
    [wId, post.skills, w.city, w.location, post.note, expiresAt]
  );
  console.log(`  ✅ Availability: ${w.name} → id ${r.insertId}`);
}

await conn.end();
console.log("\n🎉 Austin seed complete!");
console.log(`   10 employers, 10 job posts, 10 workers, 10 availability posts`);
console.log("   ShiftChef Austin feed is now live with real data. 🍳");
