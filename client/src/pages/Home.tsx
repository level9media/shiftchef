import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Zap, Shield, DollarSign, Star, ChevronRight } from "lucide-react";

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
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8 text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <Zap size={32} className="text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">
            Staff<span className="text-primary">Up</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm font-medium uppercase tracking-widest">
            Hospitality Staffing
          </p>
        </div>

        {/* Headline */}
        <h2 className="text-3xl font-bold leading-tight mb-4 max-w-xs">
          Find shifts or hire staff{" "}
          <span className="text-primary">instantly</span>
        </h2>
        <p className="text-muted-foreground text-base max-w-sm mb-10">
          Real-time marketplace connecting restaurants with skilled hospitality workers. Get paid same day.
        </p>

        {/* CTA */}
        <div className="w-full max-w-sm space-y-3">
          <a href={getLoginUrl()} className="block">
            <Button size="lg" className="w-full h-14 text-base font-bold rounded-2xl bg-primary hover:bg-primary/90">
              Get Started Free
              <ChevronRight size={20} className="ml-1" />
            </Button>
          </a>
          <a href={getLoginUrl()} className="block">
            <Button variant="outline" size="lg" className="w-full h-14 text-base font-semibold rounded-2xl border-border text-foreground">
              Browse Live Jobs
            </Button>
          </a>
        </div>
      </div>

      {/* Feature highlights */}
      <div className="px-6 pb-12 space-y-3 max-w-sm mx-auto w-full">
        <FeatureRow
          icon={<Zap size={18} className="text-primary" />}
          title="Live job feed"
          desc="Real-time shifts posted by local restaurants"
        />
        <FeatureRow
          icon={<Shield size={18} className="text-green-400" />}
          title="Secure escrow payments"
          desc="Funds held safely, released after shift"
        />
        <FeatureRow
          icon={<DollarSign size={18} className="text-yellow-400" />}
          title="90% payout to workers"
          desc="Platform only takes 10% per shift"
        />
        <FeatureRow
          icon={<Star size={18} className="text-orange-400" />}
          title="Verified ratings"
          desc="Ratings unlocked only after payment"
        />
      </div>

      {/* Footer */}
      <div className="pb-8 text-center text-xs text-muted-foreground">
        Austin, TX · Expanding to more cities soon
      </div>
    </div>
  );
}

function FeatureRow({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 bg-card rounded-xl p-3 border border-border">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-muted-foreground text-xs">{desc}</p>
      </div>
    </div>
  );
}
