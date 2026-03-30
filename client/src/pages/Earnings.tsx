import { useAuth } from "@/_core/hooks/useAuth";
import { SEOHead } from "@/components/SEOHead";
import { trpc } from "@/lib/trpc";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  DollarSign, TrendingUp, Clock, CheckCircle, Wallet,
  ArrowDownLeft, ChefHat, AlertCircle, Banknote, Smartphone,
  ExternalLink, ShieldCheck, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  cook: "Cook", sous_chef: "Sous Chef", prep: "Prep Cook",
  dishwasher: "Dishwasher", cleaner: "Cleaner", server: "Server",
  bartender: "Bartender", host: "Host", manager: "Manager",
};

export default function Earnings() {
  const { isAuthenticated } = useAuth();

  const { data: earnings, isLoading, refetch } = trpc.payments.earnings.useQuery(
    undefined, { enabled: isAuthenticated }
  );

  const { data: stripeStatusData, refetch: refetchStatus } = trpc.payments.stripeStatus.useQuery(
    undefined, { enabled: isAuthenticated }
  );

  const withdrawMutation = trpc.payments.withdraw.useMutation({
    onSuccess: (data) => {
      const method = (data as any).method;
      if (method === "stripe_transfer") {
        toast.success("Transfer initiated! Funds will arrive in 1–2 business days.");
      } else {
        toast.success("Payout queued — Stripe Express will deposit automatically.");
      }
      refetch();
      refetchStatus();
    },
    onError: (e) => toast.error(e.message),
  });

  const connectStripeMutation = trpc.payments.connectStripe.useMutation({
    onSuccess: (data) => {
      if (data.onboardingUrl) {
        toast.info("Redirecting to Stripe onboarding...");
        window.open(data.onboardingUrl, "_blank");
      } else {
        toast.success("Stripe account already connected!");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const expressDashboardMutation = trpc.payments.getExpressDashboardLink.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  const available = earnings?.availableBalance ?? 0;
  const totalEarned = earnings?.totalEarned ?? 0;
  const totalFees = earnings?.totalFees ?? 0;
  const history = earnings?.history ?? [];
  const stripeConnected = stripeStatusData?.onboardingComplete ?? earnings?.stripeOnboardingComplete ?? false;
  const stripeAccountId = earnings?.stripeAccountId;
  const hasStripeAccount = !!(stripeAccountId && !stripeAccountId.startsWith("acct_sim_"));

  // amounts come in cents from server
  const fmt = (cents: number) => (cents / 100).toFixed(2);

  return (
    <AppShell>
      <SEOHead title="Earnings & Payouts" description="Track your ShiftChef earnings, pending payouts, and connect your bank for same-day pay." canonicalPath="/earnings" />
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-10">

        {/* ── Connect Banner (not yet connected) ────────────────────────── */}
        {!stripeConnected && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex gap-3 items-start">
            <AlertCircle size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-yellow-300 text-sm">Connect your bank to get paid</p>
              <p className="text-xs text-yellow-400/80 mt-0.5 mb-3">
                Same-day pay is waiting. Connect your bank account via Stripe to receive your earnings after each shift.
              </p>
              <Button
                size="sm"
                className="w-full rounded-xl text-xs font-bold bg-yellow-500 hover:bg-yellow-400 text-black"
                disabled={connectStripeMutation.isPending}
                onClick={() => connectStripeMutation.mutate({ origin: window.location.origin })}
              >
                {connectStripeMutation.isPending ? (
                  <><RefreshCw size={12} className="mr-1.5 animate-spin" />Setting up...</>
                ) : (
                  <><Banknote size={12} className="mr-1.5" />Connect Bank Account</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── Balance Hero ──────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 p-6">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={13} className="text-primary" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Available Balance</p>
            </div>
            <p className="text-5xl font-black text-foreground">${fmt(available)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">After 10% platform fee</p>
          </div>

          {stripeConnected ? (
            <div className="mt-4 space-y-2 relative z-10">
              {/* Primary: Send to Bank */}
              <Button
                className="w-full h-12 font-bold rounded-2xl btn-glow"
                disabled={available <= 0 || withdrawMutation.isPending}
                onClick={() => withdrawMutation.mutate()}
              >
                {withdrawMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Banknote size={16} className="mr-2" />Send to Bank Account</>
                )}
              </Button>

              {/* Secondary: Add to Apple Pay / Express Dashboard */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-bold border-border/50 bg-black/20"
                  disabled={available <= 0 || withdrawMutation.isPending}
                  onClick={() => {
                    // Apple Pay / instant payout — routes through same withdraw flow
                    // Stripe Express supports instant payouts to debit cards
                    toast.info("Opening Stripe dashboard to set up instant payout...");
                    if (hasStripeAccount) {
                      expressDashboardMutation.mutate();
                    } else {
                      connectStripeMutation.mutate({ origin: window.location.origin });
                    }
                  }}
                >
                  <Smartphone size={12} className="mr-1.5" />Add to Apple Pay
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-bold border-border/50 bg-black/20"
                  disabled={expressDashboardMutation.isPending}
                  onClick={() => expressDashboardMutation.mutate()}
                >
                  {expressDashboardMutation.isPending ? (
                    <RefreshCw size={12} className="mr-1.5 animate-spin" />
                  ) : (
                    <ExternalLink size={12} className="mr-1.5" />
                  )}
                  Stripe Dashboard
                </Button>
              </div>

              {/* Connected badge */}
              <div className="flex items-center gap-1.5 justify-center pt-1">
                <ShieldCheck size={11} className="text-emerald-400" />
                <p className="text-[10px] text-emerald-400 font-medium">Bank connected via Stripe Express</p>
              </div>
            </div>
          ) : (
            <Button
              className="w-full mt-4 h-12 font-bold rounded-2xl relative z-10"
              variant="outline"
              disabled={connectStripeMutation.isPending}
              onClick={() => connectStripeMutation.mutate({ origin: window.location.origin })}
            >
              <Banknote size={16} className="mr-2" />Connect Bank to Withdraw
            </Button>
          )}
        </div>

        {/* ── How Payouts Work ──────────────────────────────────────────── */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">How Same-Day Pay Works</p>
          <div className="space-y-2.5">
            {[
              { icon: CheckCircle, color: "text-emerald-400", label: "Shift completed", sub: "Employer marks shift as ended" },
              { icon: DollarSign, color: "text-primary", label: "Payment released", sub: "90% goes to you, 10% platform fee" },
              { icon: Banknote, color: "text-blue-400", label: "Instant transfer", sub: "Stripe sends to your connected bank" },
              { icon: Smartphone, color: "text-purple-400", label: "Same-day access", sub: "Available via bank or Apple Pay" },
            ].map(({ icon: Icon, color, label, sub }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={cn("w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center flex-shrink-0", color)}>
                  <Icon size={13} />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp size={14} className="text-emerald-400" />
              </div>
              <p className="text-xs text-muted-foreground">Total Earned</p>
            </div>
            <p className="text-2xl font-black text-foreground">${fmt(totalEarned)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">All time gross</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <DollarSign size={14} className="text-orange-400" />
              </div>
              <p className="text-xs text-muted-foreground">Platform Fees</p>
            </div>
            <p className="text-2xl font-black text-foreground">${fmt(totalFees)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">10% per shift</p>
          </div>
        </div>

        {/* ── History ───────────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Payment History</p>
          {history.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <ChefHat size={36} className="text-muted-foreground/30 mb-3" />
              <p className="font-bold text-foreground">No completed shifts yet</p>
              <p className="text-sm text-muted-foreground mt-1">Complete shifts to see your earnings here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((p: any) => {
                const isReleased = p.status === "released";
                const workerPayout = p.workerPayout ?? 0;
                const platformFee = p.platformFee ?? 0;
                return (
                  <div key={p.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      isReleased ? "bg-emerald-500/10" : "bg-yellow-500/10"
                    )}>
                      {isReleased
                        ? <CheckCircle size={16} className="text-emerald-400" />
                        : <Clock size={16} className="text-yellow-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground">
                        {p.job ? (ROLE_LABELS[p.job.role] ?? p.job.role) : "Shift Payment"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.job?.restaurantName ?? ""}
                        {p.paidAt ? ` · ${new Date(p.paidAt).toLocaleDateString([], { month: "short", day: "numeric" })}` : ""}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={cn("font-black text-base", isReleased ? "text-emerald-400" : "text-yellow-400")}>
                        +${fmt(workerPayout)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">-${fmt(platformFee)} fee</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
