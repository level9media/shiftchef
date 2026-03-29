import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import AppShell from "@/components/AppShell";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, Wallet, ArrowDownLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Earnings() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const { data: earnings, isLoading, refetch } = trpc.payments.earnings.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const withdrawMutation = trpc.payments.withdraw.useMutation({
    onSuccess: () => {
      toast.success("Withdrawal initiated! Funds will arrive in 1-2 business days.");
      refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/");
  }, [isAuthenticated, authLoading]);

  if (authLoading || isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  const available = earnings?.availableBalance ?? 0;
  const totalEarned = earnings?.totalEarned ?? 0;
  const totalWithdrawn = earnings?.totalFees ?? 0; // fees deducted (proxy for withdrawn)
  const history = earnings?.history ?? [];
  const stripeConnected = earnings?.stripeOnboardingComplete ?? false;

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Header */}
        <h1 className="text-2xl font-black">Earnings</h1>

        {/* Balance card */}
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={16} className="text-primary" />
            <span className="text-sm text-muted-foreground font-medium">Available Balance</span>
          </div>
          <p className="text-5xl font-black mb-1">
            ${(available / 100).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">Ready to withdraw</p>

          {!stripeConnected ? (
            <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
              <p className="text-yellow-400 text-sm font-medium flex items-center gap-2">
                <AlertCircle size={14} />
                Connect Stripe to withdraw funds
              </p>
              <Button
                size="sm"
                className="mt-2 w-full"
                onClick={() => navigate("/profile")}
              >
                Connect Stripe Account
              </Button>
            </div>
          ) : (
            <Button
              size="lg"
              className="w-full mt-4 h-12 font-bold rounded-xl"
              disabled={available <= 0 || withdrawMutation.isPending}
              onClick={() => withdrawMutation.mutate()}
            >
              {withdrawMutation.isPending ? "Processing..." : `Withdraw $${(available / 100).toFixed(2)}`}
            </Button>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<TrendingUp size={16} className="text-green-400" />}
            label="Total Earned"
            value={`$${(totalEarned / 100).toFixed(2)}`}
          />
          <StatCard
            icon={<ArrowDownLeft size={16} className="text-blue-400" />}
            label="Total Withdrawn"
            value={`$${(totalWithdrawn / 100).toFixed(2)}`}
          />
        </div>

        {/* Platform fee note */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-start gap-3">
            <DollarSign size={16} className="text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Platform Fee: 10%</p>
              <p className="text-xs text-muted-foreground">
                StaffUp retains 10% of each shift payment. You receive 90% of the agreed pay rate.
              </p>
            </div>
          </div>
        </div>

        {/* Payment history */}
        <div>
          <h2 className="font-bold mb-3">Payment History</h2>
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <DollarSign size={32} className="text-muted-foreground opacity-40 mb-3" />
              <p className="font-semibold">No payments yet</p>
              <p className="text-sm text-muted-foreground">Complete shifts to see your earnings here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((payment: any) => (
                <PaymentHistoryRow key={payment.id} payment={payment} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}

function PaymentHistoryRow({ payment }: { payment: any }) {
  const workerPayout = payment.workerPayout ?? 0;
  const platformFee = payment.platformFee ?? 0;
  const isReleased = payment.status === "released";

  return (
    <div className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
        isReleased ? "bg-green-500/20" : "bg-yellow-500/20"
      )}>
        {isReleased
          ? <CheckCircle size={18} className="text-green-400" />
          : <Clock size={18} className="text-yellow-400" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">
          {payment.job?.restaurantName ?? "Shift Payment"}
        </p>
        <p className="text-xs text-muted-foreground">
          {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : ""}
          {" · "}
          <span className="capitalize">{payment.status}</span>
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={cn("font-black text-sm", isReleased ? "text-green-400" : "text-yellow-400")}>
          +${(workerPayout / 100).toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground">-${(platformFee / 100).toFixed(2)} fee</p>
      </div>
    </div>
  );
}
