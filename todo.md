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
- [ ] Real Stripe Connect integration (swap simulated — add live keys via Settings → Payment)
- [ ] Web push notifications via FCM
- [x] In-app notification center (bell icon dropdown) — built in AppShell
- [x] City auto-detection via geolocation — built in Feed.tsx
- [ ] Image upload for worker profiles and job posts (S3 upload)
- [x] Search and filter by role, pay rate — built in Feed.tsx
- [ ] Swipe-to-dismiss job cards (Tinder-style)
- [ ] Bottom sheet modals for apply flow

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
- [ ] Live keys: set via Settings → Payment in Management UI (requires your action)
- [ ] Webhook secret (whsec_...): add after registering endpoint in Stripe Dashboard (requires your action)

## Production Readiness & Seed Data
- [x] Seed 10 employer job posts (real Austin restaurants: Uchi, Franklin BBQ, Odd Duck, Emmer & Rye, Loro, etc.)
- [x] Seed 10 worker availability posts (real Austin kitchen workers with authentic bios)
- [x] In-app notification bell dropdown (header bell icon shows recent alerts)
- [x] City geolocation auto-detect on feed load
- [x] Search and filter on feed (by role, pay rate, role filter)
- [ ] Production webhook URL updated after publish (requires your action after publishing)

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
- [ ] Connect shiftchef.co from GoDaddy to Manus via CNAME/A record
- [ ] Publish app to production

## Enhanced Verification Flow (v7)
- [ ] Real S3 image upload for ID photo on WorkerVerification page
- [ ] Admin sees actual ID image in verification queue
- [ ] Owner notification email on verification submission
- [ ] Owner notification email on approval/rejection

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
