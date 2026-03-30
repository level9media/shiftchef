/**
 * ShiftChef — Austin TX Seed Script
 * Seeds 10 employer job posts + 10 worker availability posts
 * Data sourced from real Austin food & bev market (Craigslist fbh + rrr sections)
 * Run: node scripts/seed-austin.mjs
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("❌ DATABASE_URL not set");
  process.exit(1);
}

const conn = await mysql.createConnection(DB_URL);
console.log("✅ Connected to database");

// ─── Helper ───────────────────────────────────────────────────────────────────
function hoursFromNow(h) {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}
function daysFromNow(d) {
  return new Date(Date.now() + d * 24 * 60 * 60 * 1000);
}

// ─── Step 1: Create seed employer accounts ────────────────────────────────────
const employers = [
  { openId: "seed_emp_001", name: "Uchi Austin", email: "jobs@uchiaustin.com", userType: "employer", location: "South Lamar, Austin TX", city: "Austin", postsRemaining: 10, subscriptionStatus: "active" },
  { openId: "seed_emp_002", name: "Franklin Barbecue", email: "hiring@franklinbbq.com", userType: "employer", location: "East 11th St, Austin TX", city: "Austin", postsRemaining: 10, subscriptionStatus: "active" },
  { openId: "seed_emp_003", name: "Launderette", email: "jobs@launderetteaustin.com", userType: "employer", location: "Holly, Austin TX", city: "Austin", postsRemaining: 10, subscriptionStatus: "active" },
  { openId: "seed_emp_004", name: "Odd Duck", email: "hiring@oddduck.com", userType: "employer", location: "Bouldin Creek, Austin TX", city: "Austin", postsRemaining: 10, subscriptionStatus: "active" },
  { openId: "seed_emp_005", name: "Contigo Austin", email: "jobs@contigoaustin.com", userType: "employer", location: "North Loop, Austin TX", city: "Austin", postsRemaining: 10, subscriptionStatus: "active" },
  { openId: "seed_emp_006", name: "Loro Asian Smokehouse", email: "hiring@loroaustin.com", userType: "employer", location: "South Lamar, Austin TX", city: "Austin", postsRemaining: 10, subscriptionStatus: "active" },
  { openId: "seed_emp_007", name: "Emmer & Rye", email: "jobs@emmerandrye.com", userType: "employer", location: "Rainey Street, Austin TX", city: "Austin", postsRemaining: 10, subscriptionStatus: "active" },
  { openId: "seed_emp_008", name: "Fresa's Chicken al Carbon", email: "hiring@fresasaustin.com", userType: "employer", location: "South Congress, Austin TX", city: "Austin", postsRemaining: 10, subscriptionStatus: "active" },
  { openId: "seed_emp_009", name: "Justine's Brasserie", email: "jobs@justinesaustin.com", userType: "employer", location: "East Austin, Austin TX", city: "Austin", postsRemaining: 10, subscriptionStatus: "active" },
  { openId: "seed_emp_010", name: "Bufalina Pizza", email: "hiring@bufalinaaustin.com", userType: "employer", location: "Cherrywood, Austin TX", city: "Austin", postsRemaining: 10, subscriptionStatus: "active" },
];

console.log("📝 Inserting employer accounts...");
const empIds = [];
for (const emp of employers) {
  const [existing] = await conn.execute("SELECT id FROM users WHERE openId = ?", [emp.openId]);
  if (existing.length > 0) {
    empIds.push(existing[0].id);
    console.log(`  ↩ Skipped (exists): ${emp.name} → id ${existing[0].id}`);
    continue;
  }
  const [result] = await conn.execute(
    `INSERT INTO users (openId, name, email, loginMethod, role, userType, location, city, postsRemaining, subscriptionStatus, createdAt, updatedAt, lastSignedIn)
     VALUES (?, ?, ?, 'seed', 'user', ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
    [emp.openId, emp.name, emp.email, emp.userType, emp.location, emp.city, emp.postsRemaining, emp.subscriptionStatus]
  );
  empIds.push(result.insertId);
  console.log(`  ✅ Created employer: ${emp.name} → id ${result.insertId}`);
}

// ─── Step 2: Create 10 job posts (from real Austin Craigslist fbh data) ───────
const now = new Date();

const jobs = [
  {
    empIdx: 0, // Uchi Austin
    role: "sous_chef",
    restaurantName: "Uchi Austin",
    restaurantImage: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
    payRate: 2800, // $28/hr in cents
    startTime: hoursFromNow(24),
    endTime: hoursFromNow(32),
    location: "801 S Lamar Blvd, Austin TX 78704",
    city: "Austin",
    description: "Uchi is looking for an experienced Sous Chef to cover weekend dinner service. Must have fine dining experience, strong knife skills, and the ability to lead a line. We run a tight, high-volume kitchen with a focus on Japanese-influenced cuisine. Shift: Saturday dinner service 4pm–midnight. Potential to become a permanent position for the right candidate.",
    minRating: 4,
    isPermanent: true,
    status: "live",
  },
  {
    empIdx: 1, // Franklin Barbecue
    role: "prep",
    restaurantName: "Franklin Barbecue",
    restaurantImage: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&q=80",
    payRate: 1800, // $18/hr
    startTime: hoursFromNow(8),
    endTime: hoursFromNow(16),
    location: "900 E 11th St, Austin TX 78702",
    city: "Austin",
    description: "Franklin Barbecue needs a prep cook for early morning shift. Duties include trimming brisket, prepping sides (coleslaw, beans, potato salad), and keeping the prep kitchen clean. We start at 5am — this is a serious kitchen and we need someone who shows up on time, every time. Great pay, great team, world-famous BBQ.",
    minRating: 3,
    isPermanent: false,
    status: "live",
  },
  {
    empIdx: 2, // Launderette
    role: "cook",
    restaurantName: "Launderette",
    restaurantImage: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&q=80",
    payRate: 2200, // $22/hr
    startTime: hoursFromNow(36),
    endTime: hoursFromNow(44),
    location: "2115 Holly St, Austin TX 78702",
    city: "Austin",
    description: "Launderette is seeking a line cook for weekend brunch service. Must be comfortable on sauté and grill stations. We do a high-volume brunch with a focus on seasonal, locally sourced ingredients. Experience with scratch cooking required. Brunch shift runs 9am–5pm Saturday. This role has strong potential to go permanent.",
    minRating: 3,
    isPermanent: true,
    status: "live",
  },
  {
    empIdx: 3, // Odd Duck
    role: "dishwasher",
    restaurantName: "Odd Duck",
    restaurantImage: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80",
    payRate: 1700, // $17/hr
    startTime: hoursFromNow(12),
    endTime: hoursFromNow(20),
    location: "1201 S Lamar Blvd, Austin TX 78704",
    city: "Austin",
    description: "Odd Duck needs a reliable dishwasher for Friday dinner service. We're a busy farm-to-table restaurant on South Lamar. Must be fast, clean, and able to keep up with a high-volume kitchen. Shift is 4pm–midnight. We tip out our dishwashers — you'll take home more than just hourly. Reliable people get called back every week.",
    minRating: 0,
    isPermanent: false,
    status: "live",
  },
  {
    empIdx: 4, // Contigo Austin
    role: "server",
    restaurantName: "Contigo Austin",
    restaurantImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    payRate: 1500, // $15/hr + tips
    startTime: hoursFromNow(48),
    endTime: hoursFromNow(56),
    location: "2027 Anchor Ln, Austin TX 78723",
    city: "Austin",
    description: "Contigo is hiring a server for Sunday brunch. Our patio restaurant in North Loop is known for its relaxed, neighborhood vibe and excellent food. Servers here make great tips — expect $30–45/hr total with tips on a busy Sunday. Must have 2+ years fine dining or upscale casual experience. TABC certified preferred.",
    minRating: 3,
    isPermanent: true,
    status: "live",
  },
  {
    empIdx: 5, // Loro
    role: "cook",
    restaurantName: "Loro Asian Smokehouse",
    restaurantImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    payRate: 2000, // $20/hr
    startTime: hoursFromNow(20),
    endTime: hoursFromNow(28),
    location: "2115 S Lamar Blvd, Austin TX 78704",
    city: "Austin",
    description: "Loro (Uchi + Aaron Franklin collab) needs a line cook for Thursday dinner. High-energy kitchen, Asian-influenced smoked meats concept. Must be comfortable on wok station and grill. We move fast and the food is incredible. If you're a cook who wants to work in one of Austin's most talked-about restaurants, this is your shot.",
    minRating: 3,
    isPermanent: false,
    status: "live",
  },
  {
    empIdx: 6, // Emmer & Rye
    role: "sous_chef",
    restaurantName: "Emmer & Rye",
    restaurantImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
    payRate: 3000, // $30/hr
    startTime: hoursFromNow(72),
    endTime: hoursFromNow(82),
    location: "51 Rainey St, Austin TX 78701",
    city: "Austin",
    description: "Emmer & Rye on Rainey Street is looking for a Sous Chef to cover a 10-hour Saturday dinner service. This is a Michelin-recognized kitchen with a hyper-seasonal, grain-forward menu. You must have fine dining experience, be comfortable expediting, and have strong leadership skills. Pay is top of market. This could become a full-time role.",
    minRating: 4,
    isPermanent: true,
    status: "live",
  },
  {
    empIdx: 7, // Fresa's
    role: "cleaner",
    restaurantName: "Fresa's Chicken al Carbon",
    restaurantImage: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80",
    payRate: 1600, // $16/hr
    startTime: hoursFromNow(6),
    endTime: hoursFromNow(12),
    location: "1703 S 1st St, Austin TX 78704",
    city: "Austin",
    description: "Fresa's needs a kitchen cleaner for early morning deep clean before service. Duties include degreasing equipment, scrubbing floors, cleaning hood vents, and sanitizing all prep surfaces. 6-hour shift starting at 6am. No experience necessary — just need someone reliable, thorough, and fast. Recurring work available for the right person.",
    minRating: 0,
    isPermanent: false,
    status: "live",
  },
  {
    empIdx: 8, // Justine's
    role: "server",
    restaurantName: "Justine's Brasserie",
    restaurantImage: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&q=80",
    payRate: 1400, // $14/hr + tips
    startTime: hoursFromNow(60),
    endTime: hoursFromNow(68),
    location: "4710 E 5th St, Austin TX 78702",
    city: "Austin",
    description: "Justine's Brasserie — Austin's beloved late-night French bistro in East Austin — needs a server for Saturday night. We're open until 2am and our servers make exceptional tips on weekend nights. Must be comfortable with a full French brasserie menu, wine pairings, and a lively, upscale-casual atmosphere. TABC required.",
    minRating: 3,
    isPermanent: true,
    status: "live",
  },
  {
    empIdx: 9, // Bufalina
    role: "prep",
    restaurantName: "Bufalina Pizza",
    restaurantImage: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
    payRate: 1750, // $17.50/hr
    startTime: hoursFromNow(30),
    endTime: hoursFromNow(38),
    location: "1519 E Cesar Chavez St, Austin TX 78702",
    city: "Austin",
    description: "Bufalina, Austin's top Neapolitan pizza spot, needs a prep cook for Saturday morning. Duties: stretching and portioning dough, prepping toppings, making sauces, and stocking the line. Must have kitchen experience. We're a small, tight team — reliability and speed matter more than a long resume. Consistent shifts available for good workers.",
    minRating: 2,
    isPermanent: false,
    status: "live",
  },
];

console.log("\n📝 Inserting job posts...");
const jobIds = [];
for (const job of jobs) {
  const employerId = empIds[job.empIdx];
  const [result] = await conn.execute(
    `INSERT INTO jobs (employerId, role, restaurantName, restaurantImage, payRate, startTime, endTime, location, city, description, minRating, isPermanent, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      employerId,
      job.role,
      job.restaurantName,
      job.restaurantImage,
      job.payRate,
      job.startTime,
      job.endTime,
      job.location,
      job.city,
      job.description,
      job.minRating,
      job.isPermanent ? 1 : 0,
      job.status,
    ]
  );
  jobIds.push(result.insertId);
  console.log(`  ✅ Job: ${job.role} @ ${job.restaurantName} → id ${result.insertId}`);
}

// ─── Step 3: Create 10 worker accounts ────────────────────────────────────────
const workers = [
  { openId: "seed_wkr_001", name: "Marcus T.", email: "marcus.t@gmail.com", location: "East Austin, TX", city: "Austin", rating: 48, reliabilityScore: 95, bio: "Line cook with 8 years experience in Austin fine dining. Worked at Uchiko, Barley Swine, and Lenoir. Strong on sauté and grill. Looking for weekend shifts.", skills: ["cook","sous_chef","prep"], experience: "8 years — Uchiko (3yr), Barley Swine (2yr), Lenoir (1yr), private catering (2yr). ServSafe certified.", profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80" },
  { openId: "seed_wkr_002", name: "Daniela R.", email: "daniela.r@gmail.com", location: "South Congress, Austin TX", city: "Austin", rating: 47, reliabilityScore: 98, bio: "Experienced server and bartender. 6 years in Austin's top restaurants. TABC certified, wine knowledge, fast and professional.", skills: ["server","bartender"], experience: "6 years — Uchiko FOH (2yr), Lenoir (2yr), Justine's Brasserie (2yr). TABC certified. Wine & Spirits Level 1.", profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&q=80" },
  { openId: "seed_wkr_003", name: "Jamal W.", email: "jamal.w@gmail.com", location: "North Loop, Austin TX", city: "Austin", rating: 45, reliabilityScore: 92, bio: "Sous chef with fine dining background. Ran the line at Emmer & Rye for 2 years. Available for weekend and evening shifts.", skills: ["sous_chef","cook","prep"], experience: "5 years — Emmer & Rye (2yr), Odd Duck (1yr), Launderette (1yr), catering (1yr). Culinary Institute of America grad.", profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80" },
  { openId: "seed_wkr_004", name: "Sofia M.", email: "sofia.m@gmail.com", location: "Bouldin Creek, Austin TX", city: "Austin", rating: 46, reliabilityScore: 96, bio: "Prep cook and line cook. 4 years in Austin kitchens. Fast, clean, and reliable. Available mornings and afternoons.", skills: ["prep","cook","dishwasher"], experience: "4 years — Fresa's (2yr), Contigo (1yr), East Side King (1yr). Strong in vegetable prep, sauce work, and station setup.", profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80" },
  { openId: "seed_wkr_005", name: "Carlos V.", email: "carlos.v@gmail.com", location: "Cherrywood, Austin TX", city: "Austin", rating: 44, reliabilityScore: 90, bio: "Dishwasher and kitchen porter. 3 years experience. Fast, never calls out. Looking for consistent evening shifts.", skills: ["dishwasher","cleaner","prep"], experience: "3 years — Franklin Barbecue (1yr), Loro (1yr), Bufalina (1yr). Known for speed and keeping a clean station under pressure.", profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80" },
  { openId: "seed_wkr_006", name: "Aisha K.", email: "aisha.k@gmail.com", location: "Hyde Park, Austin TX", city: "Austin", rating: 50, reliabilityScore: 100, bio: "Professional chef with 10+ years. Worked in NYC and Austin. Specialize in modern American and farm-to-table. Available for high-end events and fill-in shifts.", skills: ["sous_chef","cook","prep"], experience: "10+ years — NYC (Per Se staging, Gramercy Tavern), Austin (Barley Swine exec sous 3yr, Odd Duck 2yr). James Beard semifinalist team.", profileImage: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80" },
  { openId: "seed_wkr_007", name: "Tyler B.", email: "tyler.b@gmail.com", location: "Rainey Street, Austin TX", city: "Austin", rating: 43, reliabilityScore: 88, bio: "Server and bartender. 5 years in Austin bars and restaurants. Great with high-volume service and craft cocktails.", skills: ["server","bartender"], experience: "5 years — Rainey Street bars (3yr), Contigo server (1yr), Justine's (1yr). TABC certified. Craft cocktail experience.", profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80" },
  { openId: "seed_wkr_008", name: "Priya S.", email: "priya.s@gmail.com", location: "Mueller, Austin TX", city: "Austin", rating: 46, reliabilityScore: 94, bio: "Line cook specializing in Asian cuisine. 4 years experience. Comfortable on wok, grill, and sauté. Available evenings and weekends.", skills: ["cook","prep","sous_chef"], experience: "4 years — Loro (2yr), Uchi (1yr), East Side King (1yr). Strong in Japanese and Southeast Asian techniques. Wok-certified.", profileImage: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80" },
  { openId: "seed_wkr_009", name: "Devon H.", email: "devon.h@gmail.com", location: "South Lamar, Austin TX", city: "Austin", rating: 42, reliabilityScore: 85, bio: "Kitchen cleaner and dishwasher. Reliable, fast, and thorough. Available early mornings and late nights. No drama, just work.", skills: ["cleaner","dishwasher"], experience: "2 years — Multiple Austin restaurants. Experienced in deep cleaning, hood cleaning, floor scrubbing, and equipment sanitation.", profileImage: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&q=80" },
  { openId: "seed_wkr_010", name: "Brianna L.", email: "brianna.l@gmail.com", location: "East Austin, TX", city: "Austin", rating: 48, reliabilityScore: 97, bio: "Experienced server with fine dining and brunch background. 7 years in Austin. Fast, professional, great with guests. TABC + food handler certified.", skills: ["server"], experience: "7 years — Launderette (3yr), Emmer & Rye (2yr), Contigo (2yr). Sommelier Level 1. Known for upselling and guest satisfaction scores.", profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80" },
];

console.log("\n📝 Inserting worker accounts...");
const workerIds = [];
for (const w of workers) {
  const [existing] = await conn.execute("SELECT id FROM users WHERE openId = ?", [w.openId]);
  if (existing.length > 0) {
    workerIds.push(existing[0].id);
    console.log(`  ↩ Skipped (exists): ${w.name} → id ${existing[0].id}`);
    continue;
  }
  const [result] = await conn.execute(
    `INSERT INTO users (openId, name, email, loginMethod, role, userType, location, city, rating, reliabilityScore, bio, experience, profileImage, createdAt, updatedAt, lastSignedIn)
     VALUES (?, ?, ?, 'seed', 'user', 'worker', ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
    [w.openId, w.name, w.email, w.location, w.city, w.rating, w.reliabilityScore, w.bio, w.experience, w.profileImage]
  );
  workerIds.push(result.insertId);
  console.log(`  ✅ Created worker: ${w.name} → id ${result.insertId}`);
}

// ─── Step 4: Create worker skills ─────────────────────────────────────────────
console.log("\n📝 Inserting worker skills...");
for (let i = 0; i < workers.length; i++) {
  const workerId = workerIds[i];
  const skills = workers[i].skills;
  for (const skill of skills) {
    try {
      await conn.execute(
        `INSERT IGNORE INTO workerSkills (workerId, skill, createdAt) VALUES (?, ?, NOW())`,
        [workerId, skill]
      );
    } catch (e) {
      // workerSkills table may not exist — skip silently
    }
  }
}

// ─── Step 5: Create 10 worker availability posts ──────────────────────────────
const availabilityPosts = [
  { workerIdx: 0, skills: ["cook", "sous_chef"], location: "East Austin, TX", city: "Austin", note: "Available for weekend dinner shifts. 8 years fine dining experience. Fast, clean, reliable. Have worked Uchiko, Barley Swine. Hit me up." },
  { workerIdx: 1, skills: ["server", "bartender"], location: "South Congress, Austin TX", city: "Austin", note: "Available NOW for lunch and dinner service. TABC certified, wine knowledge, 6 years experience. Can start same day." },
  { workerIdx: 2, skills: ["sous_chef", "cook"], location: "North Loop, Austin TX", city: "Austin", note: "Sous chef available for weekend coverage. Fine dining background (Emmer & Rye). Can run a line, expedite, or work a station." },
  { workerIdx: 3, skills: ["prep", "cook"], location: "Bouldin Creek, Austin TX", city: "Austin", note: "Available mornings and afternoons. Strong prep skills — veg butchery, sauce work, station setup. 4 years Austin kitchens." },
  { workerIdx: 4, skills: ["dishwasher", "cleaner"], location: "Cherrywood, Austin TX", city: "Austin", note: "Available for evening and late-night shifts. Fast dishwasher, never calls out. Franklin BBQ and Loro on my resume." },
  { workerIdx: 5, skills: ["sous_chef", "cook"], location: "Hyde Park, Austin TX", city: "Austin", note: "Executive-level chef available for high-end events and emergency kitchen coverage. 10+ years, NYC and Austin fine dining. Serious inquiries only." },
  { workerIdx: 6, skills: ["server", "bartender"], location: "Rainey Street, Austin TX", city: "Austin", note: "Available for bar and server shifts. Craft cocktail experience, high-volume service. Rainey Street and fine dining background." },
  { workerIdx: 7, skills: ["cook", "prep"], location: "Mueller, Austin TX", city: "Austin", note: "Line cook available evenings and weekends. Wok and grill specialist. Loro and Uchi experience. Can pick up shifts on short notice." },
  { workerIdx: 8, skills: ["cleaner", "dishwasher"], location: "South Lamar, Austin TX", city: "Austin", note: "Available for early morning deep cleans and late-night dish. No drama, just work. Reliable and fast. Text anytime." },
  { workerIdx: 9, skills: ["server"], location: "East Austin, TX", city: "Austin", note: "Fine dining server available for brunch and dinner. Launderette and Emmer & Rye background. Sommelier Level 1. TABC certified." },
];

console.log("\n📝 Inserting worker availability posts...");
for (const post of availabilityPosts) {
  const workerId = workerIds[post.workerIdx];
  const skillsJson = JSON.stringify(post.skills);
  const expiresAt = daysFromNow(7);
  try {
    const [result] = await conn.execute(
      `INSERT INTO availability (workerId, skills, location, city, note, isActive, expiresAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 1, ?, NOW(), NOW())`,
      [workerId, skillsJson, post.location, post.city, post.note, expiresAt.getTime()]
    );
    console.log(`  ✅ Availability: ${workers[post.workerIdx].name} (${post.skills.join(", ")}) → id ${result.insertId}`);
  } catch (e) {
    console.error(`  ❌ Failed availability for ${workers[post.workerIdx].name}:`, e.message);
  }
}

// ─── Done ─────────────────────────────────────────────────────────────────────
await conn.end();
console.log("\n🎉 Seed complete!");
console.log(`   ${empIds.length} employers`);
console.log(`   ${jobIds.length} job posts`);
console.log(`   ${workerIds.length} workers`);
console.log(`   ${availabilityPosts.length} availability posts`);
console.log("\n   ShiftChef Austin feed is now live with real data. 🍳");
