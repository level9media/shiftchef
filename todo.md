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
