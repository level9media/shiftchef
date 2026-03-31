import { trpc } from "@/lib/trpc";
import AppShell from "@/components/AppShell";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import {
  DollarSign, ChefHat, Star, Users, TrendingUp, Clock,
  CheckCircle, AlertCircle, BarChart3, Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  live:       { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Live" },
  filled:     { bg: "bg-blue-500/10",    text: "text-blue-400",    label: "Filled" },
  completed:  { bg: "bg-orange-500/10",  text: "text-orange-400",  label: "Completed" },
  expired:    { bg: "bg-muted",          text: "text-muted-foreground", label: "Expired" },
  cancelled:  { bg: "bg-red-500/10",     text: "text-red-400",     label: "Cancelled" },
  draft:      { bg: "bg-muted",          text: "text-muted-foreground", label: "Draft" },
};

function StarRow({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={11}
          className={i <= score ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}
        />
      ))}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-2">
      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", accent ?? "bg-orange-500/15")}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black text-foreground leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function EmployerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const authLoading = isAuthenticated === undefined;
  const [, navigate] = useLocation();

  const { data: summary, isLoading: summaryLoading } = trpc.employerDashboard.summary.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: history, isLoading: historyLoading } = trpc.employerDashboard.history.useQuery(undefined, {
    enabled: !!user,
  });

  useEffect(() => {
    if (isAuthenticated === false) navigate("/");
  }, [isAuthenticated, navigate]);

  if (authLoading || summaryLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  const fmt = (cents: number) =>
    `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <AppShell>
      <SEOHead title="Employer Dashboard — ShiftChef" canonicalPath="/employer-dashboard" />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-black text-foreground">Employer Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your complete hiring history and spending overview</p>
        </div>

        {/* Stat Cards */}
        {summary && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<DollarSign size={16} className="text-orange-400" />}
              label="Total Spent"
              value={fmt(summary.totalSpent)}
              sub={`${fmt(summary.totalPlatformFees)} platform fees`}
              accent="bg-orange-500/15"
            />
            <StatCard
              icon={<ChefHat size={16} className="text-blue-400" />}
              label="Shifts Completed"
              value={String(summary.completedShifts)}
              sub={summary.heldShifts > 0 ? `${summary.heldShifts} in escrow` : "All settled"}
              accent="bg-blue-500/15"
            />
            <StatCard
              icon={<Users size={16} className="text-emerald-400" />}
              label="Workers Hired"
              value={String(summary.uniqueWorkers)}
              sub={`${summary.totalJobs} total posts`}
              accent="bg-emerald-500/15"
            />
            <StatCard
              icon={<TrendingUp size={16} className="text-purple-400" />}
              label="Avg Cost / Shift"
              value={summary.completedShifts > 0 ? fmt(summary.avgCostPerShift) : "—"}
              sub={
                summary.avgRatingGiven != null
                  ? `Avg rating given: ${summary.avgRatingGiven.toFixed(1)}★`
                  : "No ratings given yet"
              }
              accent="bg-purple-500/15"
            />
          </div>
        )}

        {/* Preferred Workers */}
        {summary && summary.preferredWorkers && summary.preferredWorkers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award size={14} className="text-orange-400" />
              <h2 className="text-sm font-black text-foreground">Preferred Workers</h2>
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Hired 2+ times</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {summary.preferredWorkers.map((w: any) => (
                <div
                  key={w.id}
                  className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2"
                >
                  {w.avatarUrl ? (
                    <img src={w.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-400">
                      {(w.name ?? "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-foreground">{w.name ?? "Worker"}</p>
                    <p className="text-[10px] text-muted-foreground">{w.hireCount}× hired</p>
                  </div>
                  {w.rating && (
                    <div className="flex items-center gap-0.5 ml-1">
                      <Star size={10} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-[10px] text-yellow-400 font-bold">{parseFloat(w.rating).toFixed(1)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shift History */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} className="text-orange-400" />
            <h2 className="text-sm font-black text-foreground">Shift History</h2>
            {history && (
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {history.length} total
              </span>
            )}
          </div>

          {historyLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted/30 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : !history || history.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <ChefHat size={32} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-bold text-foreground">No shifts posted yet</p>
              <p className="text-xs text-muted-foreground mt-1">Post your first shift to start building your history</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((job: any) => {
                const statusCfg = STATUS_COLORS[job.status] ?? STATUS_COLORS.expired;
                const shiftDate = job.startTime
                  ? format(new Date(Number(job.startTime)), "MMM d, yyyy")
                  : "—";
                const shiftTime = job.startTime && job.endTime
                  ? `${format(new Date(Number(job.startTime)), "h:mm a")} – ${format(new Date(Number(job.endTime)), "h:mm a")}`
                  : "";
                const hours = job.startTime && job.endTime
                  ? ((Number(job.endTime) - Number(job.startTime)) / 3600000).toFixed(1)
                  : null;

                return (
                  <div
                    key={job.id}
                    className="bg-card border border-border rounded-2xl p-4"
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-black text-foreground">{job.role}</p>
                        <p className="text-xs text-muted-foreground">{job.restaurantName ?? "Your restaurant"}</p>
                      </div>
                      <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full", statusCfg.bg, statusCfg.text)}>
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Date + time + hours */}
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock size={10} />
                        {shiftDate} {shiftTime && `· ${shiftTime}`}
                        {hours && ` · ${hours}h`}
                      </div>
                      {job.applicantCount > 0 && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Users size={10} />
                          {job.applicantCount} applicant{job.applicantCount !== 1 ? "s" : ""}
                        </div>
                      )}
                    </div>

                    {/* Worker + payment row */}
                    <div className="flex items-center justify-between">
                      {/* Worker */}
                      {job.worker ? (
                        <div className="flex items-center gap-2">
                          {job.worker.avatarUrl ? (
                            <img src={job.worker.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center text-[10px] font-bold text-orange-400">
                              {(job.worker.name ?? "?")[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-bold text-foreground">{job.worker.name ?? "Worker"}</p>
                            {job.ratingGiven ? (
                              <StarRow score={job.ratingGiven.stars} />
                            ) : (
                              job.status === "completed" && (
                                <p className="text-[10px] text-muted-foreground">Not rated</p>
                              )
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <AlertCircle size={10} />
                          No worker hired
                        </div>
                      )}

                      {/* Payment */}
                      {job.payment ? (
                        <div className="text-right">
                          <p className="text-sm font-black text-foreground">{fmt(job.payment.totalCharged)}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {job.payment.status === "released" ? (
                              <span className="text-emerald-400 flex items-center gap-0.5 justify-end">
                                <CheckCircle size={9} /> Paid
                              </span>
                            ) : job.payment.status === "held" ? (
                              "In escrow"
                            ) : (
                              job.payment.status
                            )}
                          </p>
                        </div>
                      ) : (
                        job.payRate && (
                          <p className="text-sm font-black text-muted-foreground">${job.payRate}/hr</p>
                        )
                      )}
                    </div>

                    {/* Rating review */}
                    {job.ratingGiven?.review && (
                      <p className="mt-2 text-[11px] text-muted-foreground italic border-t border-border pt-2">
                        Your review: "{job.ratingGiven.review}"
                      </p>
                    )}
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
