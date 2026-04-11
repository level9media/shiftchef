import { SEOHead } from "@/components/SEOHead";
import { Link } from "wouter";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Terms of Service – ShiftChef"
        description="ShiftChef Terms of Service. Read the terms and conditions governing your use of the ShiftChef platform."
        canonicalPath="/terms"
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/">
            <span className="text-xl font-bold text-[#FF6B00] cursor-pointer">ShiftChef</span>
          </Link>
          <span className="text-muted-foreground text-sm">/ Terms of Service</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground text-sm">Last updated: March 31, 2026</p>
        </div>

        <section className="space-y-3">
          <p className="text-muted-foreground leading-relaxed">
            Welcome to ShiftChef. By accessing or using the ShiftChef mobile application or website (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            These Terms constitute a legally binding agreement between you and ShiftChef, LLC ("ShiftChef," "we," "us," or "our"). By creating an account, posting a shift, applying for a shift, or otherwise using the Service, you confirm that you are at least 18 years of age and have the legal capacity to enter into this agreement.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Description of Service</h2>
          <p className="text-muted-foreground leading-relaxed">
            ShiftChef is an on-demand hospitality staffing marketplace that connects employers ("Hirers") with independent contractors ("Workers") for temporary shift-based work in the food service and hospitality industry. ShiftChef is not an employer of Workers and does not guarantee employment, shifts, or income.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. User Accounts</h2>
          <p className="text-muted-foreground leading-relaxed">
            You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to provide accurate, current, and complete information during registration and to update such information as necessary. ShiftChef reserves the right to suspend or terminate accounts that violate these Terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Independent Contractor Relationship</h2>
          <p className="text-muted-foreground leading-relaxed">
            Workers on ShiftChef are independent contractors, not employees of ShiftChef or of the Hirers they work for through the platform. Workers are responsible for their own taxes, insurance, and compliance with applicable laws. ShiftChef does not withhold taxes, provide benefits, or guarantee minimum earnings. Workers must sign a 1099 Independent Contractor Agreement before completing their first shift.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Payments and Fees</h2>
          <p className="text-muted-foreground leading-relaxed">
            All payments are processed through Stripe. Hirers fund an escrow account before a shift begins. Upon shift completion, the Hirer releases payment. ShiftChef retains a 10% platform fee from the escrowed amount; Workers receive 90% of the agreed shift rate. Hirers pay for shift posting credits in advance. All sales are final unless otherwise stated. ShiftChef is not responsible for disputes arising from shift cancellations, no-shows, or performance issues, though we provide a dispute resolution process.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Prohibited Conduct</h2>
          <p className="text-muted-foreground leading-relaxed">
            You agree not to:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>Post false, misleading, or fraudulent shift listings or profiles</li>
            <li>Circumvent the platform to pay or receive payment outside of ShiftChef</li>
            <li>Harass, threaten, or discriminate against other users</li>
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to reverse-engineer, scrape, or disrupt the Service</li>
            <li>Create multiple accounts to abuse platform features or promotions</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Ratings and Reviews</h2>
          <p className="text-muted-foreground leading-relaxed">
            Both Workers and Hirers may rate each other after a completed shift. Ratings must be honest and based on actual experience. ShiftChef reserves the right to remove ratings that violate these Terms or are determined to be fraudulent.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Intellectual Property</h2>
          <p className="text-muted-foreground leading-relaxed">
            All content, trademarks, logos, and software associated with ShiftChef are the property of ShiftChef, LLC. You may not reproduce, distribute, or create derivative works without our express written permission.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Disclaimers and Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            The Service is provided "as is" without warranties of any kind. ShiftChef does not guarantee the quality, safety, or legality of shifts posted or the conduct of any user. To the maximum extent permitted by law, ShiftChef's total liability to you for any claims arising from use of the Service shall not exceed the greater of $100 or the fees paid by you to ShiftChef in the 12 months preceding the claim.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">10. Indemnification</h2>
          <p className="text-muted-foreground leading-relaxed">
            You agree to indemnify and hold harmless ShiftChef, its officers, directors, employees, and agents from any claims, damages, or expenses (including attorney's fees) arising from your use of the Service, your violation of these Terms, or your violation of any rights of another party.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">11. Governing Law and Dispute Resolution</h2>
          <p className="text-muted-foreground leading-relaxed">
            These Terms are governed by the laws of the State of Texas, without regard to conflict of law principles. Any disputes shall be resolved through binding arbitration in Austin, Texas, under the rules of the American Arbitration Association, except that either party may seek injunctive relief in a court of competent jurisdiction.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">12. Changes to Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update these Terms at any time. We will notify you of material changes by posting the updated Terms on this page with a revised date. Continued use of the Service after changes constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">13. Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have questions about these Terms, contact us:
          </p>
          <p className="text-muted-foreground">
            <strong>ShiftChef, LLC</strong><br />
            Austin, Texas<br />
            Email: <a href="mailto:support@shiftchef.co" className="text-[#FF6B00] hover:underline">support@shiftchef.co</a><br />
            Website: <a href="https://www.shiftchef.co" className="text-[#FF6B00] hover:underline">www.shiftchef.co</a>
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="max-w-3xl mx-auto px-4 flex gap-6 text-sm text-muted-foreground">
          <Link href="/privacy">
            <span className="hover:text-foreground cursor-pointer">Privacy Policy</span>
          </Link>
          <Link href="/faq">
            <span className="hover:text-foreground cursor-pointer">FAQ</span>
          </Link>
          <Link href="/">
            <span className="hover:text-foreground cursor-pointer">Home</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
