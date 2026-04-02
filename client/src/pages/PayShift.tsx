import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AppShell from "@/components/AppShell";
import { useLocation, useParams } from "wouter";
import { useState } from "react";
import {
  ChefHat, DollarSign, Clock, Star, CheckCircle,
  ArrowLeft, Zap, Plus, Minus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  cook: "Cook", sous_chef: "Sous Chef", prep: "Prep Cook",
  dishwasher: "Dishwasher", cleaner: "Cleaner", server: "Server",
  bartender: "Bartender", host: "Host", manager: "Manager",
};

export default function PayShift() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams<{ applicationId: string }>();
  const applicationId = parseInt(params.applicationId ?? "0");

  const [tipPercent, setTipPercent] = useState(0);
  const [customTip, setCustomTip] = useState("");
  const [tipMode, setTipMode] = useState<"percent" | "custom">("percent");
  const [paid, setPaid] = useState(false);

  const { data: shiftData, isLoading } = trpc.shifts.status.useQuery(
    { applicationId },
    { enabled: isAuthenticated && !!applicationId }
  );

  const payMutation = trpc.payments.payAfterShift.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        setPaid(true);
        toast.success("Payment sent! Worker will receive funds shortly.");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (!shiftData?.app || !shiftData?.job) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-64 text-center px-6">
          <p className="font-bold text-foreground mb-2">Shift not found</p>
          <button onClick={() => navigate("/applications")} className="text-sm text-primary">
            Back to shifts
          </button>
        </div>
      </AppShell>
    );
  }

  const { app, job } = shiftData;
  const worker = (app as any).worker;
  const hoursWorked = parseFloat(app.hoursWorked ?? "0") || 0;
  const payRate = parseFloat(job.payRate as string);
  const baseWages = Math.round(hoursWorked * payRate * 100) / 100;
  const platformFee = Math.round(baseWages * 0.10 * 100) / 100;
  const workerGets = Math.round(baseWages * 0.90 * 100) / 100;

  const tipAmount = tipMode === "percent"
    ? Math.round(baseWages * (tipPercent / 100) * 100) / 100
    : parseFloat(customTip) || 0;

  const totalDue = Math.round((baseWages + tipAmount) * 100) / 100;
  const workerTotal = Math.round((workerGets + tipAmount) * 100) / 100;

  if (paid) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
            <CheckCircle size={40} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-black text-foreground mb-2">Payment Sent!</h1>
          <p className="text-muted-foreground mb-2">
            {worker?.name ?? "Worker"} will receive <span className="text-emerald-400 font-bold">${workerTotal.toFixed(2)}</span> shortly.
          </p>
          <p className="text-xs text-muted-foreground mb-8">Transfers typically arrive within minutes via Stripe.</p>
          <button
            onClick={() => navigate("/applications")}
            className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-2xl"
          >
            Back to Shifts
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-4 pb-12">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/applications")}
            className="w-10 h-10 rounded-2xl bg-secondary border border-border flex items-center justify-center text-muted-foreground"
          >
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 className="text-xl font-black text-foreground">Pay Worker</h1>
            <p className="text-xs text-muted-foreground">Shift complete — release payment</p>
          </div>
        </div>

        {/* Worker card */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-4 flex items-center gap-3">
          {worker?.profileImage ? (
            <img src={worker.profileImage} alt="" className="w-12 h-12 rounded-xl object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <ChefHat size={20} className="text-muted-foreground" />
            </div>
          )}
          <div className="flex-1">
            <p className="font-black text-foreground">{worker?.name ?? "Worker"}</p>
            <p className="text-xs text-muted-foreground">{ROLE_LABELS[job.role] ?? job.role} · {job.restaurantName}</p>
            {worker?.rating && (
              <span className="flex items-center gap-0.5 text-[10px] text-yellow-400 mt-0.5">
                <Star size={9} strokeWidth={2.5} />
                {parseFloat(worker.rating).toFixed(1)} rating
              </span>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-primary">${workerGets.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">worker receives</p>
          </div>
        </div>

        {/* Shift summary */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-4 space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Shift Summary</p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Clock size={12} /> {hoursWorked.toFixed(2)}h worked
            </span>
            <span className="font-bold text-foreground">
              {app.checkInAt && new Date(Number(app.checkInAt)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {" – "}
              {app.checkOutAt && new Date(Number(app.checkOutAt)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">${payRate.toFixed(2)}/hr × {hoursWorked.toFixed(2)}h</span>
            <span className="font-bold text-foreground">${baseWages.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Platform fee (10%)</span>
            <span className="text-muted-foreground">-${platformFee.toFixed(2)}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between text-sm">
            <span className="font-bold text-foreground">Worker receives</span>
            <span className="font-black text-emerald-400">${workerGets.toFixed(2)}</span>
          </div>
        </div>

        {/* Tip section */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Add a tip / bonus</p>

          <div className="grid grid-cols-4 gap-2 mb-3">
            {[0, 10, 15, 20].map((pct) => (
              <button
                key={pct}
                onClick={() => { setTipPercent(pct); setTipMode("percent"); setCustomTip(""); }}
                className={cn(
                  "py-2 rounded-xl text-xs font-bold transition-all border",
                  tipMode === "percent" && tipPercent === pct
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-muted-foreground border-border"
                )}
              >
                {pct === 0 ? "None" : `${pct}%`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">$</span>
            <input
              type="number"
              value={customTip}
              onChange={(e) => { setCustomTip(e.target.value); setTipMode("custom"); setTipPercent(0); }}
              placeholder="Custom amount"
              min="0"
              step="1"
              className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          </div>

          {tipAmount > 0 && (
            <p className="text-xs text-emerald-400 mt-2 font-bold">
              +${tipAmount.toFixed(2)} tip — worker receives ${(workerGets + tipAmount).toFixed(2)} total
            </p>
          )}
        </div>

        {/* Total */}
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 mb-6">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-muted-foreground">Total you pay</span>
            <span className="text-2xl font-black text-foreground">${totalDue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Worker receives</span>
            <span className="text-sm font-black text-emerald-400">${workerTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Pay button */}
        <button
          onClick={() => payMutation.mutate({
            applicationId,
            tipAmount: tipAmount > 0 ? tipAmount : undefined,
            origin: window.location.origin,
          })}
          disabled={payMutation.isPending}
          className="w-full h-14 bg-primary text-primary-foreground font-black text-base rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {payMutation.isPending ? (
            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Zap size={18} strokeWidth={2.5} />
              Pay ${totalDue.toFixed(2)} via Stripe
            </>
          )}
        </button>

        <p className="text-center text-xs text-muted-foreground mt-3">
          Secured by Stripe · Worker receives funds instantly
        </p>
      </div>
    </AppShell>
  );
}
