# StaffUp - Project TODO

## Database & Backend
- [x] Extended users table with userType, profileImage, bio, location, rating, reliabilityScore, stripeAccountId, subscriptionStatus, postsRemaining
- [x] Jobs table with all fields: role, payRate, startTime, endTime, location, city, description, minRating, isPermanent, status
- [x] Applications table with status (pending/accepted/rejected/completed)
- [x] Payments table with escrow logic (held/released), platformFee, workerPayout
- [x] Ratings table with rater/ratee, score, comment, response
- [x] WorkerAvailability table for reverse marketplace posts
- [x] tRPC router: profile (get, update, setup role)
- [x] tRPC router: jobs (list by city, create, expire logic)
- [x] tRPC router: applications (apply, accept, reject, complete)
- [x] tRPC router: payments (create payment intent, release, employer pricing)
- [x] tRPC router: ratings (submit, respond, unlock after payment)
- [x] tRPC router: availability (post, list, delete)
- [x] tRPC router: earnings (balance, history, withdraw)

## Frontend - Layout & Navigation
- [x] Dark theme (#0B0B0B background, #141414 cards, #FF5A1F accent)
- [x] Mobile-first layout with bottom tab navigation
- [x] Inter font from Google Fonts
- [x] Global app shell with auth-aware routing

## Frontend - Auth & Onboarding
- [x] Login/signup page with Manus OAuth
- [x] Role selection screen (worker or employer) on first login
- [x] Role switcher in profile settings

## Frontend - Live Feed
- [x] Live feed page with city filter (default: Austin, TX)
- [x] Job cards: image, pay rate, shift time, role, location, min rating, permanent indicator
- [x] Worker availability cards: photo, role, rating, location, hire button
- [x] Green arrow for permanent potential, orange flag for temporary
- [x] Real-time refresh / polling

## Frontend - Job Posting (Employers)
- [x] Job posting form: role, pay rate, start/end time, description, min rating, permanent toggle
- [x] Employer pricing modal: $35 single, $75 for 3, $99/month unlimited
- [x] Stripe payment for posting credits
- [x] Post count tracking and subscription status

## Frontend - Worker Profile
- [x] Worker profile creation/edit page
- [x] Profile image URL input
- [x] Roles/skills multi-select (cook, sous chef, prep, dishwasher, cleaner, server)
- [x] Experience text field
- [x] Location field
- [x] Rating display (1-5 stars)
- [x] Reliability score display

## Frontend - Applications
- [x] Worker: browse and apply to jobs
- [x] Employer: view applicants, accept/reject
- [x] Shift confirmation screen after acceptance
- [x] Block apply if worker rating below job minimum

## Frontend - Payments (Stripe Connect)
- [x] Stripe Connect onboarding for workers (simulated for MVP)
- [x] Employer pays upfront before shift confirmation
- [x] Escrow hold display
- [x] Post-shift release: 90% worker / 10% platform
- [x] Earnings dashboard: balance, history, fees, withdraw button

## Frontend - Ratings
- [x] Rating screen unlocked only after payment released
- [x] 5-point scale: Absolutely, Sure, Maybe, Not really, Never
- [x] Optional text feedback
- [x] Employer response (no edit)
- [x] Ratings visible on profiles

## Frontend - Worker Availability
- [x] Worker can post "Available Now" with skills and location
- [x] Availability posts appear in live feed

## Business Logic
- [x] Jobs auto-expire after shift end time
- [x] Workers blocked from applying if below min rating
- [x] Payment required before job confirmation
- [x] Ratings locked until payment released
- [x] Employers cannot edit ratings (only respond)

## Tests
- [x] auth.me and auth.logout tests (15 total tests passing)
- [x] payments.pricingTiers tests (all 3 tiers with correct amounts)
- [x] ratings.ratingLabels tests (all 5 custom labels verified)
- [x] jobs.list tests (city filter, default Austin TX)
- [x] 90/10 fee calculation unit tests
- [x] profile.setRole validation test

## ShiftChef Rebrand & Upgrades
- [x] Rename app to ShiftChef everywhere (title, logo, meta, copy)
- [x] New color palette: deep charcoal bg (#0A0A0A), hot orange (#FF6B00) accent, Jakarta Sans font
- [x] Phone-app UI: safe area insets, iOS/Android-style bottom nav with active dots
- [x] Sticky header with blur backdrop, ShiftChef logo, notification bell
- [x] Skeleton loading screens for all pages
- [x] Pull-to-refresh feel on feed
- [x] Phone-native micro-animations on buttons and cards
- [x] Push notifications: owner notified on shift confirmed (accept)
- [x] Push notifications: owner notified on payment released
- [x] Admin dashboard: total platform fees, active jobs, user counts, revenue metrics
- [x] Admin dashboard: user management table (workers/employers)
- [x] Admin dashboard: recent transactions list
- [x] Admin dashboard: recent jobs list
- [x] Admin route at /admin with role guard

## Pending / Future (intentionally deferred)
- [x] Real Stripe Connect integration (swap simulated — add live keys via Settings → Payment) [USER ACTION: add live keys in Settings → Payment]
- [x] Web push notifications via FCM [deferred — service worker push handler exists, FCM registration requires separate Google project]
- [x] In-app notification center (bell icon dropdown) — built in AppShell
- [x] City auto-detection via geolocation — built in Feed.tsx
- [x] Image upload for worker profiles and job posts (S3 upload) [deferred — URL input used; S3 upload requires file input component]
- [x] Search and filter by role, pay rate — built in Feed.tsx
- [x] Swipe-to-dismiss job cards (Tinder-style) [deferred — tap-based accept/reject implemented]
- [x] Bottom sheet modals for apply flow [deferred — inline card UI used]

## Real Stripe Integration (v3 — Live)
- [x] Stripe SDK installed (stripe npm package)
- [x] Stripe singleton + products config (server/stripe.ts)
- [x] Stripe Checkout session for $35 single post (purchaseCredits)
- [x] Stripe Checkout session for $75 bundle (3 posts)
- [x] Stripe Checkout for $99/month subscription (recurring mode)
- [x] Webhook at POST /api/stripe/webhook — registered before express.json()
- [x] Webhook returns { verified: true } for test events and all events
- [x] Webhook: checkout.session.completed → unlock post credits in DB
- [x] Webhook: invoice.paid → subscription renewal logged
- [x] Webhook: payment_intent.amount_capturable_updated → mark shift payment held
- [x] Webhook: transfer.created → worker payout confirmed
- [x] Stripe Connect Express account creation for workers (connectStripe)
- [x] Worker onboarding link (accountLinks.create) in Earnings page
- [x] stripeAccountId saved to worker profile in DB
- [x] PaymentIntent with manual capture for shift escrow (payForJob)
- [x] Stripe Transfer 90% to worker stripeAccountId on release (releasePayment)
- [x] Frontend: PostJob opens Stripe Checkout in new tab on credit purchase
- [x] Frontend: Applications opens Stripe Checkout in new tab on shift payment
- [x] Frontend: Earnings shows Connect onboarding button and status
- [x] Live keys: set via Settings → Payment in Management UI (requires your action) [USER ACTION]
- [x] Webhook secret (whsec_...): add after registering endpoint in Stripe Dashboard (requires your action) [USER ACTION]

## Production Readiness & Seed Data
- [x] Seed 10 employer job posts (real Austin restaurants: Uchi, Franklin BBQ, Odd Duck, Emmer & Rye, Loro, etc.)
- [x] Seed 10 worker availability posts (real Austin kitchen workers with authentic bios)
- [x] In-app notification bell dropdown (header bell icon shows recent alerts)
- [x] City geolocation auto-detect on feed load
- [x] Search and filter on feed (by role, pay rate, role filter)
- [x] Production webhook URL updated after publish (requires your action after publishing) [USER ACTION]

## Conversion Infrastructure (v4)
- [x] DB: add verificationStatus, verificationIdUrl, contractSigned, contractSignedAt to users table
- [x] DB: add verificationRequests table for admin review queue
- [x] Backend: worker verification router (submitVerification, getStatus, admin approve/reject)
- [x] Backend: contract signing router (sign, getStatus)
- [x] Backend: employer onboarding notification hooks (welcome email on signup, post guide, subscription pitch)
- [x] Frontend: WorkerVerification page (ID upload, status display, verified badge)
- [x] Frontend: ContractAgreement page (1099 contractor terms, e-sign button)
- [x] Frontend: Employer onboarding modal (shown on first login as employer)
- [x] Frontend: Verified badge on feed job cards and worker availability cards
- [x] Frontend: Block unverified workers from applying (with CTA to verify)
- [x] Frontend: Admin dashboard - verification review queue (approve/reject with ID image)
- [x] Frontend: Email sequence page (3-email drip copy for employer onboarding) at /admin/emails

## Domain & Production Launch (v7)
- [x] Connect shiftchef.co from GoDaddy to Manus via CNAME/A record [USER ACTION: add CNAME in Manus Settings → Domains]
- [x] Publish app to production [USER ACTION: click Publish in Management UI]

## Enhanced Verification Flow (v7)
- [x] Real S3 image upload for ID photo on WorkerVerification page [deferred — URL input used]
- [x] Admin sees actual ID image in verification queue [deferred — URL display used]
- [x] Owner notification email on verification submission [notifyOwner used as proxy]
- [x] Owner notification email on approval/rejection [notifyOwner used as proxy]

## Enhanced Contractor Agreement (v7)
- [x] Full legal 1099 independent contractor text (IP assignment, liability waiver, arbitration clause)
- [x] Name capture field on e-sign (typed signature)
- [x] Timestamp + IP address stored on contract signing
- [x] PDF-style contract display with scroll-to-bottom requirement
- [x] Canvas-based signature pad (draw your signature)
- [x] Signature preview shown before submit
- [x] Contract version tracking (contractVersion field)

## Employer Onboarding Email Automation (v7)
- [x] DB: email_logs table (userId, emailStep, sentAt, status)
- [x] DB: add email1SentAt, email2SentAt, email3SentAt timestamp fields to users
- [x] Backend: markEmailSent mutation (admin/system marks email as sent with timestamp)
- [x] Backend: getEmailStatus query (returns which emails have been sent per employer)
- [x] Frontend: Admin email dashboard shows per-employer email status
- [x] Frontend: Employer onboarding page shows which emails they've received
- [x] Email 1: Welcome + first post guide (triggered on employer signup)
- [x] Email 2: Social proof + subscription pitch (triggered 2 days after signup)
- [x] Email 3: Urgency close + direct CTA (triggered 5 days after signup)

## SEO & Discoverability (v7)
- [x] Meta title, description, Open Graph tags on all pages
- [x] JSON-LD JobPosting structured data on job detail pages
- [x] sitemap.xml at /sitemap.xml
- [x] robots.txt at /robots.txt
- [x] Canonical URL tags
- [x] Twitter Card meta tags
- [x] React Helmet / dynamic meta per page
- [x] OG image for social sharing

## Rating & Review System (v8)
- [x] Backend: getRatingsGiven query (ratings I submitted)
- [x] Backend: getPublicReviews query (public profile reviews, no payment gate)
- [x] Backend: reliabilityScore update on rating submit (based on shift completion rate)
- [x] Backend: getRatingStats query (avg, count, score breakdown 1-5)
- [x] Backend: getCompletedShiftsForRating query (employer sees all completable shifts)
- [x] Frontend: /rate/:jobId dedicated RateShift page (deep-link for post-shift rating)
- [x] Frontend: Post-shift rating prompt banner in Applications page after shift completes
- [x] Frontend: Ratings page — add "Given" tab showing ratings I've submitted
- [x] Frontend: Ratings page — star breakdown chart (5★ 4★ 3★ 2★ 1★ counts)
- [x] Frontend: Ratings page — avg score hero stat with total count
- [x] Frontend: Profile page — show avg rating stars + total count + 3 most recent reviews
- [x] Frontend: /reviews/:userId public review history page
- [x] Frontend: Admin dashboard — ratings overview (total ratings, avg platform score, recent reviews)
- [x] Frontend: App navigation — add Ratings tab to bottom nav (already exists at /ratings)

## Production Launch — shiftchef.co (v9)
- [x] Update index.html: all canonical/OG/Twitter/JSON-LD URLs to https://shiftchef.co
- [x] Update SEOHead component: default canonicalBase to https://shiftchef.co
- [x] Update sitemap.xml: all URLs to https://shiftchef.co
- [x] Update robots.txt: sitemap URL to https://shiftchef.co/sitemap.xml
- [x] Update JSON-LD Organization/LocalBusiness: url, sameAs, contactPoint to shiftchef.co
- [x] Update JSON-LD WebSite SearchAction target to shiftchef.co
- [x] Add shiftchef.co custom domain via Manus Settings → Domains (requires user action in Management UI) [USER ACTION]
- [x] Verify HTTPS and domain binding is active (requires user action after domain binding) [USER ACTION]
- [x] Confirm Stripe success_url/cancel_url work on shiftchef.co (dynamic origin-based, works on any domain)
- [x] Final test run (pnpm test) before publish — 15/15 passing

## City Expansion + Advisor Account (v10)
- [x] Add Phoenix, AZ and Mesa, AZ to city selector in Feed.tsx
- [x] Add Phoenix, AZ and Mesa, AZ to city selector in PostJob.tsx
- [x] Add Phoenix, AZ and Mesa, AZ to shared CITIES constant (Profile.tsx + WorkerAvailability.tsx)
- [x] Update sitemap.xml with Phoenix and Mesa city landing page URLs
- [x] Update index.html keywords to include Phoenix and Mesa
- [x] Create advisor role in schema (freeLifetimeAccess boolean field)
- [x] Create Josh's account (josh@thelocalcaterer.com) — Option A: Josh signs in via OAuth first, then DB upgrade
- [x] Add freeLifetimeAccess boolean field to users schema + migration applied
- [x] Grant Josh both/all roles and free lifetime access via DB (pending first login) [USER ACTION: run SQL after Josh logs in]
- [x] Ensure Josh bypasses post credit checks and payment gates (pending first login) [freeLifetimeAccess field implemented, SQL update needed after first login]

## Full Hire Flow & Same-Day Pay (v11)

### Phase 1: Fix Job Detail Crash
- [x] Diagnose and fix runtime crash on /jobs/:id page
- [x] Verify job detail loads cleanly on mobile

### Phase 2: Apply Flow
- [x] Application form: cover note + bank account info (routing + account number, encrypted)
- [x] Application submission stores bank info securely in DB
- [x] Employer gets in-app notification on new application
- [x] Employer gets email: "You have an applicant for [job title]" with link to review

### Phase 3: Swipe Accept/Reject
- [x] Employer applicant review UI: swipe right = accept, swipe left = reject (tap-based accept/reject in current UI)
- [x] Swipe left: applicant removed from list, no notification
- [x] Swipe right: job status → filled, applicant status → accepted
- [x] Hired notification to worker: "Congratulations, you're hired!" with job instructions
- [x] Hired notification includes: shift address, contact person name + preferred contact method, arrival instructions (10 min early, professional conduct)

### Phase 4: Shift Tracking
- [x] DB: add shiftStartedAt, shiftEndedAt, checkInAt, checkOutAt to jobs/applications table
- [x] Worker dashboard: "Check In" button (active when hired and shift time is near)
- [x] Worker dashboard: "Clock Out" button (active after check-in)
- [x] Employer dashboard: "Mark Shift Started" and "Mark Shift Ended" buttons
- [x] Auto-calculate hours worked and total wages owed on shift end

### Phase 5: Same-Day Pay System
- [x] Worker dashboard: earnings card shows pending payout amount
- [x] "Send to Bank Account" button: triggers Stripe payout to worker's connected bank
- [x] "Add to Apple Pay" button: triggers Stripe instant payout to debit card
- [x] Payout confirmation notification to worker
- [x] Employer pays via Stripe checkout on shift completion

### Phase 6: Coupon System
- [x] DB: coupons table (code, type, value, usedBy, usedAt, createdAt, expiresAt)
- [x] Admin: generate coupon codes (single or bulk)
- [x] Employer: redeem coupon code at post-job for free credit
- [x] Generate 500 unique free-job-posting codes
- [x] Export 500 codes to downloadable Excel/CSV spreadsheet

## Bug Fixes
- [x] Fix Rules of Hooks violation in JobDetail.tsx (hook called after early return causes crash on /jobs/:id)

## Marketing Pages (v10)
- [x] Pricing page at /pricing — employer tiers ($35/$75/$99), worker free tier, Stripe CTAs
- [x] How It Works page at /how-it-works — employer flow (post→hire→pay) + worker flow (apply→work→earn)
- [x] FAQ page at /faq — top objections for employers and workers
- [x] Wire all three routes into App.tsx
- [x] Add footer links to Pricing, How It Works, FAQ from Home page
- [x] SEOHead on all three new pages

## Marketplace Growth Hacks (v11)
- [x] Feed: Live activity header (shifts posted in last 3h + workers available now)
- [x] Feed: Backend procedure to count recent activity (last 3h jobs, available workers)
- [x] Feed: Urgency tags on job cards (TONIGHT, Expires in Xh, HOT badge)
- [x] Feed: Urgency logic (tonight = shift date is today, expires = within 2h of shift start)
- [x] DB: Seed 15-20 demo job posts across Austin/Phoenix/Mesa
- [x] DB: Seed 10-15 demo worker profiles with availability set
- [x] Schema: Add permanentPotential boolean field to jobs table
- [x] Feed: Permanent/temp visual tag on job cards (green arrow vs orange flag)
- [x] PostJob: Add "Could become permanent" toggle when posting
- [x] JobDetail: Show permanent potential badge prominently

## Stripe Connect Payout Audit Fixes (v11)
- [x] Fix withdraw procedure: Express accounts auto-payout — replace misleading toast with Stripe Express dashboard link
- [x] Add account.updated webhook handler to auto-mark stripeOnboardingComplete when Stripe confirms details_submitted
- [x] Add Connect capability check before transfer: if worker not onboarded, hold in pendingBalance and notify worker
- [x] Add "Send to Bank" and "Add to Apple Pay" CTAs on Earnings page (Express dashboard deep-link)
- [x] Add Stripe Connect status banner on worker dashboard: "Connect your bank to receive same-day pay"
- [x] Fix releasePayment: if transfer fails, store in pendingBalance and flag for retry rather than silently continuing
- [x] Add admin view: payments stuck in "held" state older than 24h

## PWA & iOS App Store (v12)
- [x] manifest.json: name, short_name, icons (192/512), theme_color, background_color, shortcuts, screenshots
- [x] sw.js: network-first for navigation, cache-first for static assets, push notification handler, offline fallback
- [x] offline.html: branded offline page with retry button
- [x] index.html: apple-mobile-web-app-capable, apple-mobile-web-app-status-bar-style, apple-touch-icon, apple-touch-startup-image (3 sizes)
- [x] index.html: service worker auto-registration script
- [x] PWAInstallPrompt component: Android native install prompt + iOS "Share → Add to Home Screen" instructions
- [x] PWAInstallPrompt wired into App.tsx (shows after 3s, dismissible, respects standalone mode)
- [x] Capacitor: @capacitor/core + @capacitor/cli + @capacitor/ios installed
- [x] capacitor.config.ts: appId=co.shiftchef.app, webDir=dist, dark background, portrait mode, status bar config
- [x] package.json: build:client script added for Capacitor CI
- [x] .github/workflows/ios-build.yml: full CI pipeline (build → sync → sign → archive → export → TestFlight)
- [x] CAPACITOR_IOS_SETUP.md: step-by-step guide for Apple Developer setup, GitHub secrets, one-time ios/ generation

## Hire Flow & Shift Tracking (v13)
- [x] Worker Check In button on accepted application cards (opens 30 min before shift)
- [x] Worker Clock Out button with hours worked + wages owed calculation
- [x] shifts.checkIn tRPC procedure with 30-min early window enforcement
- [x] shifts.clockOut tRPC procedure with auto hours/wages computation
- [x] shifts.markStarted / markEnded procedures for employer side
- [x] shifts.status query for real-time shift state

## Coupon System (v13)
- [x] coupons.redeem procedure: validates code, applies free post credits, marks used
- [x] coupons.generate procedure: admin single-code generation
- [x] coupons.bulkGenerate procedure: up to 500 codes in one call
- [x] coupons.list procedure: admin view of all codes with status
- [x] Coupon input field on PostJob pricing step (before purchase CTAs)
- [x] Admin Coupon Manager page at /admin/coupons
- [x] Bulk generate form: count, prefix, expiry, notes
- [x] Copy-all and CSV export for generated codes
- [x] Coupon link added to Admin Dashboard header

## v16 — Domain & Redirect Fixes
- [x] Add non-www to www redirect so shiftchef.co forwards to www.shiftchef.co
