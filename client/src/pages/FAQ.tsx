import { SEOHead } from "@/components/SEOHead";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState } from "react";
import { ChevronDown, Building2, ChefHat, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItem {
  q: string;
  a: string;
}

const EMPLOYER_FAQS: FAQItem[] = [
  {
    q: "How fast can I get staff for a shift?",
    a: "Most employers receive their first applicants within 15–30 minutes of posting. For same-day shifts, we recommend posting at least 2–3 hours in advance. For weekend events, posting 24–48 hours ahead gives you the best selection of qualified workers.",
  },
  {
    q: "What does it cost to post a shift?",
    a: "A single shift post is $35. A 3-post bundle is $75 (save $30). Unlimited monthly posting is $99/month. There are no hidden fees — you pay for the post, then fund the worker's escrow when you hire. ShiftChef takes a 10% platform fee from the escrow, not from you.",
  },
  {
    q: "How do I pay the worker?",
    a: "When you hire a worker, you fund a Stripe escrow equal to the shift's total pay. After the shift ends and you confirm completion, funds are released to the worker's account automatically. You never handle cash or Venmo — it's all secure and documented.",
  },
  {
    q: "Are workers employees or contractors?",
    a: "All ShiftChef workers are independent 1099 contractors. They sign a contractor agreement before their first shift. You are not responsible for payroll taxes, benefits, or workers' comp. Always consult your own legal or tax advisor for your specific situation.",
  },
  {
    q: "What if a worker doesn't show up?",
    a: "If a hired worker no-shows, you can mark them as a no-show in the app. Their reliability score drops significantly, making them less competitive for future shifts. Your escrow is not released — you can re-post the shift at no additional credit cost.",
  },
  {
    q: "Can I see a worker's ratings and experience before hiring?",
    a: "Yes. Every worker profile shows their star rating, total shifts completed, reliability score, skills, and any reviews from previous employers. You can review all applicants before making a hire decision.",
  },
  {
    q: "What roles can I post for?",
    a: "ShiftChef supports all hospitality and food service roles: servers, bartenders, barbacks, line cooks, prep cooks, dishwashers, hosts/hostesses, event staff, catering staff, and more. If it's a hospitality role, you can post it.",
  },
  {
    q: "Do I need a subscription to use ShiftChef?",
    a: "No. You can start with a single $35 post and only upgrade if you need more volume. The $99/month unlimited plan is best for restaurants and venues that staff multiple shifts per week.",
  },
];

const WORKER_FAQS: FAQItem[] = [
  {
    q: "Is it free to apply for shifts?",
    a: "Yes, 100% free. There are no fees to create a profile, apply for shifts, or receive payment. ShiftChef takes a 10% platform fee from the employer-funded escrow — you keep 90% of every shift's pay.",
  },
  {
    q: "How does same-day pay work?",
    a: "When your shift ends and the employer confirms completion, the escrow releases to your ShiftChef account. From there, you can transfer to your linked bank account or Apple Pay. Most transfers complete within a few hours — same day.",
  },
  {
    q: "Do I need to verify my identity?",
    a: "Yes. ID verification is required before applying to shifts. This protects employers and ensures you're treated as a trusted professional. Verification takes about 2 minutes — upload a government-issued ID and you're done.",
  },
  {
    q: "Am I an employee or a contractor?",
    a: "You are an independent 1099 contractor. You choose which shifts to apply for, set your own schedule, and work for multiple employers. You are responsible for your own taxes. ShiftChef provides a contractor agreement you sign before your first shift.",
  },
  {
    q: "What cities are available?",
    a: "ShiftChef is currently live in Austin TX, Phoenix AZ, and Mesa AZ. We are expanding to additional cities — sign up and you'll be notified when your city goes live.",
  },
  {
    q: "What if I get hired but can't make the shift?",
    a: "If you need to cancel, do so as early as possible through the app. Frequent cancellations after being hired will lower your reliability score, making it harder to get hired in the future. Employers depend on you showing up — professionalism is everything.",
  },
  {
    q: "What should I bring and how should I arrive?",
    a: "Arrive at least 10 minutes early. Dress appropriately for the role (ask the employer if unsure). Bring any required equipment or certifications. Be professional, courteous, and ready to work. Your rating depends on it.",
  },
  {
    q: "How do ratings work?",
    a: "After every completed shift, both you and the employer rate each other 1–5 stars. Your average rating and reliability score are visible to all employers. High ratings mean more job offers and higher-paying shifts. Low ratings reduce your visibility.",
  },
];

function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          <button
            className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="text-sm font-semibold text-foreground leading-snug">{item.q}</span>
            <ChevronDown
              size={16}
              className={cn(
                "flex-shrink-0 text-muted-foreground transition-transform duration-200",
                open === i && "rotate-180"
              )}
            />
          </button>
          {open === i && (
            <div className="px-4 pb-4">
              <p className="text-xs text-muted-foreground leading-relaxed">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function FAQ() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"employer" | "worker">("employer");

  return (
    <AppShell>
      <SEOHead
        title="FAQ — ShiftChef | Hospitality Staffing Questions Answered"
        description="Answers to the most common questions about ShiftChef — for employers hiring hospitality staff and workers looking for on-demand shifts in Austin, Phoenix, and Mesa."
        canonicalPath="/faq"
      />

      <div className="max-w-lg mx-auto px-4 pb-32 pt-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-4">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">FAQ</span>
          </div>
          <h1 className="text-3xl font-black text-foreground mb-2">
            Questions answered.
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Everything you need to know before your first shift — whether you're hiring or working.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-6 bg-secondary rounded-xl p-1">
          <button
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-bold transition-all",
              tab === "employer"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
            onClick={() => setTab("employer")}
          >
            <Building2 size={14} />
            Employers
          </button>
          <button
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-bold transition-all",
              tab === "worker"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
            onClick={() => setTab("worker")}
          >
            <ChefHat size={14} />
            Workers
          </button>
        </div>

        {/* FAQ accordion */}
        {tab === "employer" ? (
          <FAQAccordion items={EMPLOYER_FAQS} />
        ) : (
          <FAQAccordion items={WORKER_FAQS} />
        )}

        {/* Bottom CTA */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-5 text-center">
          <p className="font-bold text-foreground text-sm mb-1">Still have a question?</p>
          <p className="text-xs text-muted-foreground mb-4">
            Reach out at{" "}
            <a href="mailto:support@shiftchef.co" className="text-primary hover:underline">
              support@shiftchef.co
            </a>{" "}
            and we'll get back to you within a few hours.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-10 text-sm font-bold rounded-xl"
              onClick={() => navigate("/pricing")}
            >
              See Pricing
            </Button>
            <Button
              className="flex-1 h-10 text-sm font-bold rounded-xl btn-glow"
              onClick={() => navigate("/how-it-works")}
            >
              How It Works
              <ArrowRight size={13} className="ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
