import { SEOHead } from "@/components/SEOHead";
import { Link } from "wouter";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Privacy Policy – ShiftChef"
        description="ShiftChef Privacy Policy. Learn how we collect, use, and protect your personal information."
        canonicalPath="/privacy"
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/">
            <span className="text-xl font-bold text-[#FF6B00] cursor-pointer">ShiftChef</span>
          </Link>
          <span className="text-muted-foreground text-sm">/ Privacy Policy</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm">Last updated: March 31, 2026</p>
        </div>

        <section className="space-y-3">
          <p className="text-muted-foreground leading-relaxed">
            ShiftChef ("we," "us," or "our") operates the ShiftChef mobile application and website
            (collectively, the "Service"). This Privacy Policy explains how we collect, use, disclose,
            and safeguard your information when you use our Service. Please read this policy carefully.
          </p>
        </section>

        <Section title="1. Information We Collect">
          <p>We collect the following types of information:</p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li><strong className="text-foreground">Account Information:</strong> Name, email address, and profile photo provided when you sign in via Google OAuth.</li>
            <li><strong className="text-foreground">Profile Information:</strong> Job role, skills, work experience, location (city), bio, and profile image URL that you voluntarily provide.</li>
            <li><strong className="text-foreground">Job & Shift Data:</strong> Job postings, shift times, pay rates, and application history.</li>
            <li><strong className="text-foreground">Payment Information:</strong> Stripe Connect account details for processing payments. We do not store full card numbers — all payment data is handled by Stripe.</li>
            <li><strong className="text-foreground">Usage Data:</strong> Pages visited, features used, device type, IP address, and browser/app version for analytics and service improvement.</li>
            <li><strong className="text-foreground">Communications:</strong> Messages or support requests you send us.</li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>To create and manage your account</li>
            <li>To match workers with employers and facilitate shift bookings</li>
            <li>To process payments and manage earnings via Stripe Connect</li>
            <li>To display your public profile to other users of the platform</li>
            <li>To send transactional notifications (shift confirmations, payment releases, ratings)</li>
            <li>To improve the Service through analytics and usage data</li>
            <li>To comply with legal obligations</li>
          </ul>
        </Section>

        <Section title="3. Sharing of Information">
          <p className="text-muted-foreground leading-relaxed">
            We do not sell your personal information. We may share your information in the following circumstances:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground mt-2">
            <li><strong className="text-foreground">With Other Users:</strong> Your public profile (name, photo, role, rating, location) is visible to other ShiftChef users as part of the marketplace.</li>
            <li><strong className="text-foreground">With Stripe:</strong> Payment processing is handled by Stripe. Your use of Stripe is subject to <a href="https://stripe.com/privacy" className="text-[#FF6B00] underline" target="_blank" rel="noopener noreferrer">Stripe's Privacy Policy</a>.</li>
            <li><strong className="text-foreground">With Service Providers:</strong> We use third-party services (hosting, analytics, authentication) that may process data on our behalf under confidentiality agreements.</li>
            <li><strong className="text-foreground">Legal Requirements:</strong> We may disclose information if required by law or to protect the rights and safety of our users.</li>
          </ul>
        </Section>

        <Section title="4. Data Retention">
          <p className="text-muted-foreground leading-relaxed">
            We retain your account information for as long as your account is active or as needed to provide the Service.
            You may request deletion of your account and associated data by contacting us at{" "}
            <a href="mailto:support@shiftchef.co" className="text-[#FF6B00] underline">support@shiftchef.co</a>.
            Payment records may be retained for up to 7 years as required by financial regulations.
          </p>
        </Section>

        <Section title="5. Security">
          <p className="text-muted-foreground leading-relaxed">
            We implement industry-standard security measures including HTTPS encryption, secure session management,
            and access controls. However, no method of transmission over the internet is 100% secure.
            We encourage you to use a strong, unique password and to contact us immediately if you suspect
            unauthorized access to your account.
          </p>
        </Section>

        <Section title="6. Your Rights">
          <p className="text-muted-foreground leading-relaxed">
            Depending on your location, you may have the following rights regarding your personal data:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground mt-2">
            <li><strong className="text-foreground">Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li><strong className="text-foreground">Correction:</strong> Update or correct inaccurate information via your profile settings.</li>
            <li><strong className="text-foreground">Deletion:</strong> Request deletion of your account and personal data.</li>
            <li><strong className="text-foreground">Portability:</strong> Request an export of your data in a machine-readable format.</li>
            <li><strong className="text-foreground">Opt-out:</strong> Unsubscribe from marketing communications at any time.</li>
          </ul>
          <p className="text-muted-foreground mt-2">
            To exercise any of these rights, contact us at{" "}
            <a href="mailto:support@shiftchef.co" className="text-[#FF6B00] underline">support@shiftchef.co</a>.
          </p>
        </Section>

        <Section title="7. Children's Privacy">
          <p className="text-muted-foreground leading-relaxed">
            ShiftChef is not directed to children under the age of 18. We do not knowingly collect personal
            information from anyone under 18. If you believe a minor has provided us with personal information,
            please contact us and we will promptly delete it.
          </p>
        </Section>

        <Section title="8. Third-Party Links">
          <p className="text-muted-foreground leading-relaxed">
            Our Service may contain links to third-party websites. We are not responsible for the privacy
            practices of those sites and encourage you to review their privacy policies.
          </p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p className="text-muted-foreground leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of significant changes
            by posting the new policy on this page with an updated date. Continued use of the Service after
            changes constitutes acceptance of the updated policy.
          </p>
        </Section>

        <Section title="10. Contact Us">
          <p className="text-muted-foreground leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          <div className="mt-3 p-4 bg-card rounded-lg border border-border space-y-1 text-sm">
            <p><strong>ShiftChef</strong></p>
            <p>Austin, Texas</p>
            <p>Email: <a href="mailto:support@shiftchef.co" className="text-[#FF6B00] underline">support@shiftchef.co</a></p>
            <p>Website: <a href="https://www.shiftchef.co" className="text-[#FF6B00] underline">www.shiftchef.co</a></p>
          </div>
        </Section>
      </main>

      <footer className="border-t border-border mt-16 py-8 text-center text-muted-foreground text-sm">
        <p>© 2026 ShiftChef. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/privacy"><span className="hover:text-foreground cursor-pointer">Privacy Policy</span></Link>
          <Link href="/faq"><span className="hover:text-foreground cursor-pointer">FAQ</span></Link>
          <Link href="/"><span className="hover:text-foreground cursor-pointer">Home</span></Link>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}
