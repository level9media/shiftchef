# ShiftChef iOS App Store Deployment Guide
## Capacitor + GitHub Actions (No Mac Required)

---

## Overview

ShiftChef uses **Capacitor** to wrap the web app into a native iOS shell. Because you don't have a Mac, the Xcode build runs on **GitHub's macOS CI runners** (`macos-14`, Apple Silicon). You push code → GitHub builds the `.ipa` → uploads to TestFlight automatically.

---

## Step 1: Apple Developer Account Setup

1. Go to [developer.apple.com](https://developer.apple.com) and enroll ($99/year).
2. Once approved, create your **App ID**:
   - Bundle ID: `co.shiftchef.app`
   - Capabilities: Push Notifications, Associated Domains
3. Create a **Distribution Certificate** (`.p12`):
   - Keychain Access → Certificate Assistant → Request from CA
   - Upload `.certSigningRequest` to Apple Developer portal
   - Download `.cer`, double-click to import to Keychain
   - Export from Keychain as `.p12` with a strong password
4. Create an **App Store Provisioning Profile**:
   - Type: App Store Distribution
   - App ID: `co.shiftchef.app`
   - Download the `.mobileprovision` file

---

## Step 2: App Store Connect Setup

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Create a new App:
   - Name: **ShiftChef**
   - Bundle ID: `co.shiftchef.app`
   - SKU: `shiftchef-001`
   - Primary Language: English (U.S.)
3. Create an **API Key** for CI:
   - Users and Access → Integrations → App Store Connect API
   - Generate a new key with **Developer** role
   - Download the `.p8` file (you can only download it once)
   - Note the **Key ID** and **Issuer ID**

---

## Step 3: GitHub Repository Secrets

Push the ShiftChef code to a GitHub repo, then add these secrets at:
`Settings → Secrets and variables → Actions → New repository secret`

| Secret Name | Value |
|---|---|
| `IOS_DISTRIBUTION_CERT_P12_BASE64` | Base64 of your `.p12` file: `base64 -i cert.p12 \| pbcopy` |
| `IOS_DISTRIBUTION_CERT_P12_PASSWORD` | Password you set on the `.p12` |
| `APPLE_TEAM_ID` | Your 10-character Team ID from developer.apple.com |
| `APPSTORE_ISSUER_ID` | Issuer ID from App Store Connect API key page |
| `APPSTORE_API_KEY_ID` | Key ID from App Store Connect API key page |
| `APPSTORE_API_PRIVATE_KEY` | Contents of the `.p8` file (paste the full text) |
| `VITE_APP_ID` | From Manus project settings |
| `VITE_OAUTH_PORTAL_URL` | From Manus project settings |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key |
| `VITE_FRONTEND_FORGE_API_KEY` | From Manus project settings |
| `VITE_FRONTEND_FORGE_API_URL` | From Manus project settings |

---

## Step 4: Generate the iOS Xcode Project Locally (One-Time)

> You need a Mac **once** to generate the `ios/` folder. After that, CI handles everything.
> 
> **Alternative if you have no Mac access at all:** Use a Mac cloud service like [MacStadium](https://www.macstadium.com) or [GitHub Codespaces with macOS](https://github.com/features/codespaces) for this one-time step.

```bash
# On a Mac (or macOS cloud instance):
cd shiftchef
pnpm install
pnpm run build:client       # builds the Vite dist/
npx cap add ios             # generates ios/ Xcode project
npx cap sync ios            # copies web assets into ios/
git add ios/
git commit -m "feat: add Capacitor iOS project"
git push
```

Once `ios/` is committed, GitHub Actions handles all future builds.

---

## Step 5: Trigger a Build

```bash
# Option A: Push to main branch
git push origin main

# Option B: Tag a release
git tag v1.0.0
git push origin v1.0.0

# Option C: Manual trigger in GitHub Actions UI
# Go to Actions → iOS Build & Archive → Run workflow
```

---

## Step 6: Monitor the Build

1. Go to your GitHub repo → **Actions** tab
2. Click the **iOS Build & Archive** workflow
3. Watch the steps: Install → Build Web → Sync Capacitor → Sign → Archive → Export → Upload
4. On success, download the `.ipa` from **Artifacts** or check **TestFlight** in App Store Connect

---

## Step 7: App Store Submission Checklist

Before submitting for review:

- [ ] App icon (1024x1024) uploaded in App Store Connect
- [ ] Screenshots for iPhone 6.7" and 6.1" (required)
- [ ] App description, keywords, and support URL filled in
- [ ] Privacy Policy URL: `https://shiftchef.co/privacy`
- [ ] Age rating questionnaire completed
- [ ] Review notes explaining the app's purpose
- [ ] Test account credentials for App Review team

---

## Architecture: How It Works

```
GitHub Push
    │
    ▼
GitHub Actions (macos-14 runner)
    │
    ├── pnpm install
    ├── pnpm run build:client  →  dist/ (Vite bundle)
    ├── npx cap sync ios       →  copies dist/ into ios/App/App/public/
    ├── Import .p12 cert
    ├── Download provisioning profile via App Store Connect API
    ├── xcodebuild archive     →  ShiftChef.xcarchive
    ├── xcodebuild -exportArchive  →  ShiftChef.ipa
    ├── Upload artifact to GitHub
    └── xcrun altool upload    →  TestFlight
```

---

## Live-Reload Development (Optional)

To test on a physical iPhone without rebuilding:

1. Temporarily set `server.url` in `capacitor.config.ts` to your dev server URL
2. Build and sync: `npx cap sync ios`
3. Open in Xcode and run on device

---

## Troubleshooting

| Issue | Fix |
|---|---|
| `No signing certificate` | Re-export `.p12` and update the GitHub secret |
| `Provisioning profile not found` | Verify Bundle ID matches `co.shiftchef.app` exactly |
| `Build failed: xcodebuild` | Check Xcode version on runner; update `runs-on: macos-14` if needed |
| `altool upload failed` | Verify `.p8` key contents — no extra whitespace |
| `dist/ not found` | Ensure `pnpm run build:client` script exists in `package.json` |

---

## Next Steps After App Store Approval

1. **Switch Stripe to live keys** in Manus Settings → Payment
2. **Configure Apple Pay** via Stripe (optional but high-converting)
3. **Enable Push Notifications** via Capacitor Push plugin for shift alerts
4. **Add deep links** (`shiftchef.co/jobs/:id`) via Associated Domains
