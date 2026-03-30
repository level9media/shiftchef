import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, Clock, CheckCircle, Wallet, ArrowDownLeft, ChefHat, AlertCircle } from "lucide-react";
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

  const withdrawMutation = trpc.payments.withdraw.useMutation({
    onSuccess: () => { toast.success("Withdrawal initiated!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const { data: stripeStatusData } = trpc.payments.stripeStatus.useQuery(
    undefined, { enabled: isAuthenticated }
  );

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

  // amounts come in cents from server
  const fmt = (cents: number) => (cents / 100).toFixed(2);

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-10">

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

          {!stripeConnected ? (
            <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 relative z-10">
              <p className="text-yellow-400 text-xs font-bold flex items-center gap-1.5 mb-2">
                <AlertCircle size={12} /> Connect Stripe to withdraw
              </p>
              <Button
                size="sm"
                className="w-full rounded-xl text-xs"
                disabled={connectStripeMutation.isPending}
                onClick={() => connectStripeMutation.mutate({ origin: window.location.origin })}
              >
                {connectStripeMutation.isPending ? "Setting up..." : "Connect Bank Account"}
              </Button>
            </div>
          ) : (
            <Button
              className="w-full mt-4 h-12 font-bold rounded-2xl btn-glow relative z-10"
              disabled={available <= 0 || withdrawMutation.isPending}
              onClick={() => withdrawMutation.mutate()}
            >
              {withdrawMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <><ArrowDownLeft size={16} className="mr-2" />Withdraw ${fmt(available)}</>
              )}
            </Button>
          )}
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
