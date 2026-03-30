import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  Clock, CheckCircle, XCircle, ChefHat, Briefcase,
  DollarSign, Star, Zap, ArrowRight, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const ROLE_LABELS: Record<string, string> = {
  cook: "Cook", sous_chef: "Sous Chef", prep: "Prep Cook",
  dishwasher: "Dishwasher", cleaner: "Cleaner", server: "Server",
  bartender: "Bartender", host: "Host", manager: "Manager",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "Pending",   color: "text-yellow-400", bg: "bg-yellow-400/10" },
  accepted:  { label: "Accepted",  color: "text-emerald-400", bg: "bg-emerald-400/10" },
  rejected:  { label: "Rejected",  color: "text-red-400",    bg: "bg-red-400/10" },
  confirmed: { label: "Confirmed", color: "text-blue-400",   bg: "bg-blue-400/10" },
  completed: { label: "Completed", color: "text-muted-foreground", bg: "bg-secondary" },
};

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatDate(ms: number) {
  const d = new Date(ms);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function Applications() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"worker" | "employer">("worker");

  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const utils = trpc.useUtils();

  const { data: myApps, isLoading: appsLoading } = trpc.applications.myApplications.useQuery(
    undefined, { enabled: isAuthenticated }
  );
  const { data: myJobs, isLoading: jobsLoading } = trpc.jobs.myJobs.useQuery(
    undefined, { enabled: isAuthenticated }
  );

  const acceptMutation = trpc.applications.accept.useMutation({
    onSuccess: () => { toast.success("Applicant accepted!"); utils.jobs.myJobs.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const rejectMutation = trpc.applications.reject.useMutation({
    onSuccess: () => { toast.success("Applicant rejected"); utils.jobs.myJobs.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const payMutation = trpc.payments.payForJob.useMutation({
    onSuccess: (data) => {
      toast.info("Redirecting to secure checkout...");
      window.open(data.url, "_blank");
    },
    onError: (e) => toast.error(e.message),
  });
  const completeMutation = trpc.jobs.complete.useMutation({
    onSuccess: () => { toast.success("Shift marked complete!"); utils.jobs.myJobs.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const releaseMutation = trpc.payments.releasePayment.useMutation({
    onSuccess: () => { toast.success("Payment released to worker!"); utils.jobs.myJobs.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const isWorker = !profile?.userType || profile.userType === "worker" || profile.userType === "both";
  const isEmployer = profile?.userType === "employer" || profile?.userType === "both";

  return (
    <AppShell>
      <div className="max-w-lg mx-auto">
        {/* ── Sticky Tabs ───────────────────────────────────────────────── */}
        <div
          className="sticky z-30 border-b border-border px-4 py-3"
          style={{
            top: "calc(3.5rem + var(--sat))",
            background: "oklch(0.06 0 0 / 0.95)",
            backdropFilter: "blur(16px)",
          }}
        >
          <div className="flex gap-1 bg-secondary rounded-xl p-1">
            {isWorker && (
              <button
                onClick={() => setTab("worker")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all",
                  tab === "worker" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                <ChefHat size={11} strokeWidth={2.5} /> My Applications
              </button>
            )}
            {isEmployer && (
              <button
                onClick={() => setTab("employer")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all",
                  tab === "employer" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                <Briefcase size={11} strokeWidth={2.5} /> My Shifts
              </button>
            )}
          </div>
        </div>

        {/* ── Worker: My Applications ───────────────────────────────────── */}
        {tab === "worker" && (
          <div className="px-4 py-4 space-y-3">
            {appsLoading ? (
              <Skeletons />
            ) : !myApps?.length ? (
              <EmptyState
                icon={<ChefHat size={36} className="text-muted-foreground/30" />}
                title="No applications yet"
                desc="Browse the live feed and apply to shifts"
                action={{ label: "Browse Shifts", onClick: () => navigate("/feed") }}
              />
            ) : (
              myApps.map((app: any) => {
                const status = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
                const job = app.job;
                const hours = job ? ((job.endTime - job.startTime) / 3600000).toFixed(1) : "?";
                const pay = job ? (parseFloat(job.payRate) * parseFloat(hours) * 0.9).toFixed(0) : "?";
                return (
                  <div
                    key={app.id}
                    className="bg-card rounded-2xl border border-border p-4 card-press"
                    onClick={() => job && navigate(`/jobs/${job.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-black text-sm text-foreground">
                          {job ? (ROLE_LABELS[job.role] ?? job.role) : "Shift"}
                        </p>
                        {job?.restaurantName && (
                          <p className="text-xs text-muted-foreground mt-0.5">{job.restaurantName}</p>
                        )}
                      </div>
                      <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-full flex-shrink-0", status.bg, status.color)}>
                        {status.label}
                      </span>
                    </div>

                    {job && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <MetaPill icon={<Clock size={9} />}>
                          {formatDate(job.startTime)} · {formatTime(job.startTime)}–{formatTime(job.endTime)}
                        </MetaPill>
                        <MetaPill icon={<DollarSign size={9} />}>~${pay} earned</MetaPill>
                      </div>
                    )}

                    {app.status === "accepted" && (
                      <div className="mt-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                        <p className="text-xs text-emerald-400 font-bold mb-2">Accepted! Pay to confirm your shift.</p>
                        <Button
                          size="sm"
                          className="w-full rounded-xl text-xs font-bold btn-glow"
                          disabled={payMutation.isPending}
                          onClick={(e) => { e.stopPropagation(); payMutation.mutate({ jobId: app.jobId ?? app.job?.id, origin: window.location.origin }); }}
                        >
                          {payMutation.isPending ? "Processing..." : `Pay & Confirm Shift`}
                        </Button>
                      </div>
                    )}

                    {app.status === "confirmed" && (
                      <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                        <p className="text-xs text-blue-400 font-bold flex items-center gap-1.5">
                          <CheckCircle size={12} /> Shift confirmed — show up and get paid!
                        </p>
                      </div>
                    )}

                    <p className="text-[10px] text-muted-foreground mt-2">
                      Applied {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Employer: My Jobs ─────────────────────────────────────────── */}
        {tab === "employer" && (
          <div className="px-4 py-4 space-y-3">
            <button
              onClick={() => navigate("/post-job")}
              className="w-full flex items-center justify-between bg-primary/10 border border-primary/30 rounded-2xl p-4 card-press"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                  <Zap size={15} className="text-primary-foreground" strokeWidth={2.5} />
                </div>
                <span className="font-bold text-sm text-foreground">Post a New Shift</span>
              </div>
              <ArrowRight size={15} className="text-primary" />
            </button>

            {jobsLoading ? (
              <Skeletons />
            ) : !myJobs?.length ? (
              <EmptyState
                icon={<Briefcase size={36} className="text-muted-foreground/30" />}
                title="No shifts posted yet"
                desc="Post your first shift to start receiving applications"
              />
            ) : (
              myJobs.map((job: any) => (
                <EmployerJobCard
                  key={job.id}
                  job={job}
                  onAccept={(appId) => acceptMutation.mutate({ applicationId: appId })}
                  onReject={(appId) => rejectMutation.mutate({ applicationId: appId })}
                  onMarkComplete={(jobId) => completeMutation.mutate({ id: jobId })}
                  onRelease={(jobId) => releaseMutation.mutate({ jobId })}
                  responding={acceptMutation.isPending || rejectMutation.isPending}
                  releasing={releaseMutation.isPending}
                />
              ))
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function EmployerJobCard({ job, onAccept, onReject, onMarkComplete, onRelease, responding, releasing }: {
  job: any;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
  onMarkComplete: (id: number) => void;
  onRelease: (id: number) => void;
  responding: boolean;
  releasing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: apps } = trpc.applications.forJob.useQuery({ jobId: job.id }, { enabled: expanded });
  const hours = ((job.endTime - job.startTime) / 3600000).toFixed(1);
  const confirmedApp = apps?.find((a: any) => a.status === "confirmed" || a.status === "completed");

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 text-left">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-black text-sm text-foreground">
              {ROLE_LABELS[job.role] ?? job.role}
              {job.restaurantName && <span className="text-muted-foreground font-normal"> · {job.restaurantName}</span>}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <MetaPill icon={<Clock size={9} />}>
                {formatDate(job.startTime)} · {hours}h
              </MetaPill>
              <MetaPill icon={<DollarSign size={9} />}>${job.payRate}/hr</MetaPill>
              <span className={cn(
                "text-[10px] font-black px-2 py-0.5 rounded-full",
                job.status === "live" ? "bg-emerald-500/20 text-emerald-400" : "bg-secondary text-muted-foreground"
              )}>
                {job.status}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-3">
            <p className="text-xs font-bold text-foreground">{job.applicationCount ?? 0} applied</p>
            <p className="text-[10px] text-muted-foreground">{expanded ? "▲ hide" : "▼ show"}</p>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border">
          {!apps ? (
            <div className="p-4 flex justify-center">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : apps.length === 0 ? (
            <p className="p-4 text-xs text-muted-foreground text-center">No applications yet</p>
          ) : (
            <div className="divide-y divide-border">
              {apps.map((app: any) => {
                const status = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
                return (
                  <div key={app.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {app.worker?.profileImage ? (
                          <img src={app.worker.profileImage} alt="" className="w-9 h-9 rounded-xl object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                            <ChefHat size={14} className="text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-foreground">{app.worker?.name ?? "Worker"}</p>
                          {app.worker?.rating && (
                            <span className="flex items-center gap-0.5 text-[10px] text-yellow-400">
                              <Star size={9} strokeWidth={2.5} />
                              {parseFloat(app.worker.rating).toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full", status.bg, status.color)}>
                        {status.label}
                      </span>
                    </div>

                    {app.coverNote && (
                      <p className="text-xs text-muted-foreground italic mb-2">"{app.coverNote}"</p>
                    )}

                    <div className="flex gap-2">
                      {app.status === "pending" && (
                        <>
                          <Button size="sm" className="flex-1 rounded-xl text-xs" disabled={responding} onClick={() => onAccept(app.id)}>
                            <CheckCircle2 size={11} className="mr-1" /> Accept
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 rounded-xl text-xs" disabled={responding} onClick={() => onReject(app.id)}>
                            <XCircle size={11} className="mr-1" /> Reject
                          </Button>
                        </>
                      )}
                      {app.status === "confirmed" && (
                        <Button size="sm" className="flex-1 rounded-xl text-xs" onClick={() => onMarkComplete(job.id)}>
                          Mark Complete
                        </Button>
                      )}
                      {app.status === "completed" && app.paymentStatus === "held" && (
                        <Button size="sm" className="flex-1 rounded-xl text-xs btn-glow" disabled={releasing} onClick={() => onRelease(app.jobId ?? job.id)}>
                          {releasing ? "Releasing..." : "Release Payment"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetaPill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
      {icon}{children}
    </span>
  );
}

function Skeletons() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card rounded-2xl border border-border p-4 space-y-2 animate-pulse">
          <div className="h-4 bg-secondary rounded-lg w-1/2" />
          <div className="h-3 bg-secondary rounded-lg w-1/3" />
          <div className="h-8 bg-secondary rounded-xl mt-2" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, title, desc, action }: {
  icon: React.ReactNode; title: string; desc: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4">{icon}</div>
      <p className="font-bold text-foreground mb-1">{title}</p>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">{desc}</p>
      {action && (
        <Button size="sm" className="rounded-xl" onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}
