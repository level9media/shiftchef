import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AppShell from "@/components/AppShell";
import { Link } from "wouter";
import {
  DollarSign, Users, Briefcase, TrendingUp, ChefHat,
  Activity, Clock, CheckCircle, AlertCircle, ArrowLeft, ShieldCheck, Mail
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  cook: "Cook", sous_chef: "Sous Chef", prep: "Prep Cook",
  dishwasher: "Dishwasher", cleaner: "Cleaner", server: "Server",
  bartender: "Bartender", host: "Host", manager: "Manager",
};

const STATUS_COLORS: Record<string, string> = {
  live: "bg-emerald-500/20 text-emerald-400",
  filled: "bg-blue-500/20 text-blue-400",
  completed: "bg-purple-500/20 text-purple-400",
  expired: "bg-red-500/20 text-red-400",
  held: "bg-yellow-500/20 text-yellow-400",
  released: "bg-emerald-500/20 text-emerald-400",
  pending: "bg-orange-500/20 text-orange-400",
};

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();

  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery(
    undefined, { enabled: isAuthenticated && user?.role === "admin" }
  );
  const { data: recentPayments } = trpc.admin.recentPayments.useQuery(
    undefined, { enabled: isAuthenticated && user?.role === "admin" }
  );
  const { data: recentUsers } = trpc.admin.recentUsers.useQuery(
    undefined, { enabled: isAuthenticated && user?.role === "admin" }
  );
  const { data: recentJobs } = trpc.admin.recentJobs.useQuery(
    undefined, { enabled: isAuthenticated && user?.role === "admin" }
  );
  const utils = trpc.useUtils();
  const { data: verificationQueue } = trpc.verification.adminQueue.useQuery(
    undefined, { enabled: isAuthenticated && user?.role === "admin" }
  );
  const adminReviewMutation = trpc.verification.adminReview.useMutation({
    onSuccess: () => {
      utils.verification.adminQueue.invalidate();
      toast.success("Verification updated");
    },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <AlertCircle size={40} className="text-destructive mb-4" />
          <p className="font-black text-xl text-foreground">Admin Access Required</p>
          <p className="text-sm text-muted-foreground mt-2">This page is restricted to platform administrators.</p>
          <Link href="/feed" className="mt-4 text-primary text-sm font-bold hover:underline">
            ← Back to Feed
          </Link>
        </div>
      </AppShell>
    );
  }

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-4 space-y-5 pb-10">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Link href="/feed">
            <button className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
              <ArrowLeft size={14} className="text-muted-foreground" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-black text-foreground">Admin Dashboard</h1>
            <p className="text-xs text-muted-foreground">ShiftChef Platform Overview</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/admin/emails">
              <button className="flex items-center gap-1.5 text-[10px] font-black bg-secondary text-muted-foreground px-2 py-1 rounded-full hover:bg-primary/20 hover:text-primary transition-colors">
                <Mail size={9} /> Emails
              </button>
            </Link>
            <span className="text-[10px] font-black bg-primary/20 text-primary px-2 py-1 rounded-full">ADMIN</span>
          </div>
        </div>

        {/* ── Stats Grid ────────────────────────────────────────────────── */}
        {statsLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="bg-card rounded-2xl border border-border h-24 animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Revenue Hero */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 p-5">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={13} className="text-primary" />
                  <p className="text-xs font-bold text-primary uppercase tracking-wider">Platform Revenue</p>
                </div>
                <p className="text-4xl font-black text-foreground">{fmt(stats?.totalPlatformFees ?? 0)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Total fees collected (10% per shift)</p>
                <div className="flex items-center gap-4 mt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Volume</p>
                    <p className="font-black text-foreground">{fmt(stats?.totalVolume ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Released</p>
                    <p className="font-black text-emerald-400">{fmt(stats?.totalReleased ?? 0)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={<Users size={14} className="text-blue-400" />} label="Total Users" value={String(stats?.totalUsers ?? 0)} sub="All time" color="bg-blue-500/10" />
              <StatCard icon={<Briefcase size={14} className="text-purple-400" />} label="Total Jobs" value={String(stats?.totalJobs ?? 0)} sub={`${stats?.activeJobs ?? 0} live now`} color="bg-purple-500/10" />
              <StatCard icon={<Activity size={14} className="text-emerald-400" />} label="Applications" value={String(stats?.totalApplications ?? 0)} sub="All time" color="bg-emerald-500/10" />
              <StatCard icon={<DollarSign size={14} className="text-orange-400" />} label="Payments" value={String(stats?.totalPayments ?? 0)} sub="Processed" color="bg-orange-500/10" />
            </div>
          </>
        )}

        {/* ── Recent Payments ───────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Recent Payments</p>
          <div className="space-y-2">
            {!recentPayments?.length ? (
              <EmptyCard label="No payments yet" />
            ) : (
              recentPayments.slice(0, 8).map((p: any) => (
                <div key={p.id} className="bg-card rounded-2xl border border-border p-3.5 flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                    p.status === "released" ? "bg-emerald-500/10" : "bg-yellow-500/10"
                  )}>
                    {p.status === "released"
                      ? <CheckCircle size={14} className="text-emerald-400" />
                      : <Clock size={14} className="text-yellow-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-foreground truncate">
                      {p.job ? (ROLE_LABELS[p.job.role] ?? p.job.role) : "Shift"}
                      {p.job?.restaurantName ? ` · ${p.job.restaurantName}` : ""}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {p.worker?.name ?? "Worker"} → {p.employer?.name ?? "Employer"}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-sm text-foreground">{fmt(p.amount ?? 0)}</p>
                    <p className="text-[10px] text-primary">+{fmt(p.platformFee ?? 0)} fee</p>
                    <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded-full", STATUS_COLORS[p.status] ?? "bg-secondary text-muted-foreground")}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Recent Jobs ───────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Recent Jobs</p>
          <div className="space-y-2">
            {!recentJobs?.length ? (
              <EmptyCard label="No jobs yet" />
            ) : (
              recentJobs.slice(0, 8).map((j: any) => (
                <div key={j.id} className="bg-card rounded-2xl border border-border p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <ChefHat size={14} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-foreground truncate">
                      {ROLE_LABELS[j.role] ?? j.role}
                      {j.restaurantName ? ` · ${j.restaurantName}` : ""}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {j.city} · {j.employer?.name ?? "Employer"}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-sm text-foreground">${j.payRate}/hr</p>
                    <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded-full", STATUS_COLORS[j.status] ?? "bg-secondary text-muted-foreground")}>
                      {j.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

          {/* ── Verification Queue ────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ID Verification Queue</p>
            {verificationQueue && verificationQueue.length > 0 && (
              <span className="bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                {verificationQueue.length} pending
              </span>
            )}
          </div>
          <div className="space-y-2">
            {!verificationQueue?.length ? (
              <EmptyCard label="No pending verifications ✔" />
            ) : (
              verificationQueue.map((req: any) => (
                <div key={req.id} className="bg-card rounded-2xl border border-orange-500/30 p-3.5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck size={14} className="text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-foreground">{req.userName ?? "Unknown"}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{req.userEmail ?? "No email"}</p>
                    </div>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400">PENDING</span>
                  </div>
                  {req.idImageUrl && (
                    <img
                      src={req.idImageUrl}
                      alt="Submitted ID"
                      className="w-full h-28 object-cover rounded-xl mb-3 border border-border"
                    />
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => adminReviewMutation.mutate({ requestId: req.id, decision: "approved" })}
                      disabled={adminReviewMutation.isPending}
                      className="flex-1 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => adminReviewMutation.mutate({ requestId: req.id, decision: "rejected", adminNote: "Does not meet requirements" })}
                      disabled={adminReviewMutation.isPending}
                      className="flex-1 py-2 rounded-xl bg-destructive/20 text-destructive text-xs font-bold hover:bg-destructive/30 transition-colors disabled:opacity-50"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Recent Users ──────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Recent Users</p>
          <div className="space-y-2">
            {!recentUsers?.length ? (
              <EmptyCard label="No users yet" />
            ) : (
              recentUsers.slice(0, 10).map((u: any) => (
                <div key={u.id} className="bg-card rounded-2xl border border-border p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-black text-muted-foreground">
                      {(u.name ?? "U")[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-foreground">{u.name ?? "Unknown"}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{u.email ?? "No email"}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded-full",
                      u.role === "admin" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                    )}>
                      {u.role}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(u.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", color)}>{icon}</div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-black text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}

function EmptyCard({ label }: { label: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 text-center">
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
