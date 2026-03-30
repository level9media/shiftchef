import { SEOHead } from "@/components/SEOHead";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Check, Zap, Star, Crown, ChefHat, ArrowRight, Shield, Clock, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLoginUrl } from "@/const";

const EMPLOYER_TIERS = [
  {
    id: "single" as const,
    name: "Single Post",
    price: "$35",
    period: "per post",
    credits: 1,
    icon: <Zap size={20} className="text-white" />,
    color: "#FF6B00",
    highlight: false,
    description: "Perfect for trying ShiftChef or filling a one-off shift fast.",
    features: [
      "1 shift posting",
      "Instant applicant notifications",
      "Applicant profiles + ratings",
      "Accept / reject with one tap",
      "Secure Stripe escrow payment",
      "Post live within 60 seconds",
    ],
  },
  {
    id: "bundle3" as const,
    name: "3-Post Bundle",
    price: "$75",
    period: "for 3 posts",
    credits: 3,
    icon: <Star size={20} className="text-white" />,
    color: "#FF6B00",
    highlight: true,
    badge: "Best Value",
    description: "Save $30 vs. single posts. Ideal for weekly staffing needs.",
    features: [
      "3 shift postings",
      "Everything in Single Post",
      "Priority feed placement",
      "Save $30 vs. single rate",
      "Credits never expire",
      "Use across multiple shifts",
    ],
  },
  {
    id: "subscription" as const,
    name: "Unlimited Monthly",
    price: "$99",
    period: "per month",
    credits: 999,
    icon: <Crown size={20} className="text-white" />,
    color: "#8B5CF6",
    highlight: false,
    description: "Post as many shifts as you need. Built for high-volume operators.",
    features: [
      "Unlimited shift postings",
      "Everything in Bundle",
      "Top-of-feed placement",
      "Dedicated support",
      "Cancel anytime",
      "Best per-post rate",
    ],
  },
];

const WORKER_PERKS = [
  { icon: <DollarSign size={16} className="text-emerald-400" />, text: "Always free to apply" },
  { icon: <Clock size={16} className="text-emerald-400" />, text: "Same-day pay after shift" },
  { icon: <Shield size={16} className="text-emerald-400" />, text: "Secure escrow — always get paid" },
  { icon: <Star size={16} className="text-emerald-400" />, text: "Build your rating and reputation" },
  { icon: <ChefHat size={16} className="text-emerald-400" />, text: "Access Austin, Phoenix, Mesa shifts" },
  { icon: <Zap size={16} className="text-emerald-400" />, text: "Instant hire notifications" },
];

export default function Pricing() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const purchaseMutation = trpc.payments.purchaseCredits.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.success("Redirecting to checkout...");
        window.open(data.url, "_blank");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  function handleBuy(tier: "single" | "bundle3" | "subscription") {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    purchaseMutation.mutate({ tier, origin: window.location.origin });
  }

  return (
    <AppShell>
      <SEOHead
        title="Pricing — ShiftChef | Hire Hospitality Staff in Austin, Phoenix & Mesa"
        description="Post a shift for $35, get a 3-pack for $75, or go unlimited for $99/month. Workers always apply free. Same-day pay guaranteed."
        canonicalPath="/pricing"
      />

      <div className="max-w-lg mx-auto px-4 pb-32 pt-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-4">
            <Zap size={12} className="text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Simple Pricing</span>
          </div>
          <h1 className="text-3xl font-black text-foreground mb-2">
            Hire fast.<br />Pay fair.
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            No subscription required to start. Post one shift, see results, scale from there.
          </p>
        </div>

        {/* Employer Tiers */}
        <div className="mb-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">For Employers</p>
          <div className="space-y-3">
            {EMPLOYER_TIERS.map((tier) => (
              <div
                key={tier.id}
                className={cn(
                  "relative rounded-2xl border p-5 transition-all",
                  tier.highlight
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border bg-card"
                )}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                      {tier.badge}
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: tier.color }}
                    >
                      {tier.icon}
                    </div>
                    <div>
                      <p className="font-black text-foreground text-base">{tier.name}</p>
                      <p className="text-xs text-muted-foreground">{tier.description}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-2xl font-black text-foreground">{tier.price}</p>
                    <p className="text-[10px] text-muted-foreground">{tier.period}</p>
                  </div>
                </div>

                <ul className="space-y-1.5 mb-4">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check size={12} className="text-primary flex-shrink-0" strokeWidth={3} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  className={cn(
                    "w-full h-11 font-bold rounded-xl text-sm",
                    tier.highlight ? "btn-glow" : ""
                  )}
                  variant={tier.highlight ? "default" : "outline"}
                  onClick={() => handleBuy(tier.id)}
                  disabled={purchaseMutation.isPending}
                >
                  {purchaseMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Get {tier.name}
                      <ArrowRight size={14} className="ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Coupon note */}
        <div className="bg-secondary/50 border border-border rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
          <Zap size={14} className="text-primary flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Have a promo code? Enter it at checkout for free post credits.
          </p>
        </div>

        {/* Worker section */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <ChefHat size={18} className="text-emerald-400" />
            <p className="font-black text-foreground">For Workers — Always Free</p>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Applying for shifts, getting hired, and receiving same-day pay is 100% free for workers. ShiftChef takes a 10% platform fee from the employer-funded escrow — you keep 90% of every shift.
          </p>
          <ul className="space-y-2 mb-4">
            {WORKER_PERKS.map((p, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-foreground">
                {p.icon}
                {p.text}
              </li>
            ))}
          </ul>
          <Button
            className="w-full h-11 font-bold rounded-xl text-sm bg-emerald-500 hover:bg-emerald-600 text-white border-0"
            onClick={() => isAuthenticated ? navigate("/feed") : window.location.href = getLoginUrl()}
          >
            Browse Open Shifts
            <ArrowRight size={14} className="ml-1.5" />
          </Button>
        </div>

        {/* FAQ teaser */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-2">Have questions?</p>
          <button
            onClick={() => navigate("/faq")}
            className="text-primary text-sm font-bold hover:underline"
          >
            Read the FAQ →
          </button>
        </div>
      </div>
    </AppShell>
  );
}
