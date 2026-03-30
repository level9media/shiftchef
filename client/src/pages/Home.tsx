import { SEOHead, buildOrganizationSchema, buildWebSiteSchema } from "@/components/SEOHead";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { ChefHat, Zap, Shield, DollarSign, Star, ArrowRight, TrendingUp } from "lucide-react";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/feed");
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background flex flex-col overflow-hidden"
      style={{ paddingTop: "var(--sat)" }}
    >
      <SEOHead
        title="Find Shifts. Hire Fast. Austin Hospitality Staffing"
        description="ShiftChef is Austin's on-demand hospitality staffing marketplace. Restaurants post kitchen shifts in 2 minutes, verified workers apply fast. Secure escrow payments, 1099 contracts."
        canonicalPath="/"
        jsonLd={buildWebSiteSchema()}
      />
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, oklch(0.68 0.22 38 / 0.12), transparent)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center shadow-lg btn-glow">
            <ChefHat size={18} className="text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span
            className="text-xl font-black tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Shift<span className="text-primary">Chef</span>
          </span>
        </div>
        <a href={getLoginUrl()}>
          <button className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-xl hover:bg-secondary">
            Sign in
          </button>
        </a>
      </div>

      {/* Hero */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-8 pb-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 bg-primary/15 border border-primary/30 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-6 fade-in-up">
          <Zap size={11} strokeWidth={2.5} />
          Real-time hospitality staffing
        </div>

        {/* Headline */}
        <h1
          className="text-5xl font-black leading-[1.05] tracking-tight mb-4 fade-in-up card-2"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Find shifts.
          <br />
          <span className="text-primary">Hire fast.</span>
        </h1>

        <p className="text-muted-foreground text-base max-w-xs leading-relaxed mb-10 fade-in-up card-3">
          Connect with skilled kitchen staff in minutes. Post a shift, get paid same day.
        </p>

        {/* CTAs */}
        <div className="w-full max-w-xs space-y-3 fade-in-up card-4">
          <a href={getLoginUrl()} className="block">
            <Button
              size="lg"
              className="w-full h-14 text-base font-bold rounded-2xl btn-glow"
            >
              Get Started Free
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </a>
          <a href={getLoginUrl()} className="block">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-14 text-base font-semibold rounded-2xl border-border bg-secondary/50 text-foreground"
            >
              Browse Live Shifts
            </Button>
          </a>
        </div>

        {/* Social proof */}
        <div className="flex items-center gap-2 mt-8 fade-in-up card-5">
          <div className="flex -space-x-2">
            {["#FF6B35", "#FF8C42", "#FFA552", "#FFB86C"].map((c, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold text-white"
                style={{ background: c }}
              >
                {["C", "S", "P", "D"][i]}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground font-semibold">500+</span> shifts filled in Austin
          </p>
        </div>
      </div>

      {/* Feature cards */}
      <div className="relative z-10 px-5 pb-10 space-y-2.5 max-w-sm mx-auto w-full">
        <FeatureCard
          icon={<Zap size={16} className="text-primary" />}
          color="oklch(0.68 0.22 38 / 0.12)"
          title="Live job feed"
          desc="Real-time shifts from local restaurants"
        />
        <FeatureCard
          icon={<Shield size={16} className="text-emerald-400" />}
          color="oklch(0.55 0.15 155 / 0.12)"
          title="Secure escrow payments"
          desc="Funds held safely, released after shift"
        />
        <FeatureCard
          icon={<DollarSign size={16} className="text-yellow-400" />}
          color="oklch(0.85 0.18 95 / 0.12)"
          title="90% payout to workers"
          desc="We only take 10% — you keep the rest"
        />
        <FeatureCard
          icon={<TrendingUp size={16} className="text-blue-400" />}
          color="oklch(0.60 0.18 250 / 0.12)"
          title="Permanent potential"
          desc="Temp shifts that can turn into full-time roles"
        />
      </div>

      {/* Footer */}
      <div
        className="relative z-10 pb-6 text-center text-xs text-muted-foreground space-y-2"
        style={{ paddingBottom: "calc(var(--sab) + 1.5rem)" }}
      >
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => navigate("/how-it-works")} className="text-primary hover:underline font-semibold">How It Works</button>
          <span className="opacity-30">|</span>
          <button onClick={() => navigate("/pricing")} className="text-primary hover:underline font-semibold">Pricing</button>
          <span className="opacity-30">|</span>
          <button onClick={() => navigate("/faq")} className="text-primary hover:underline font-semibold">FAQ</button>
        </div>
        <p>Austin, TX &middot; Phoenix, AZ &middot; Mesa, AZ</p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  color,
  title,
  desc,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl p-3.5 border border-border card-press"
      style={{ background: "oklch(0.10 0 0)" }}>
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color }}
      >
        {icon}
      </div>
      <div>
        <p className="font-semibold text-sm text-foreground">{title}</p>
        <p className="text-muted-foreground text-xs mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
