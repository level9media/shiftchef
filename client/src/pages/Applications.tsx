import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import AppShell from "@/components/AppShell";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  Clock, MapPin, Star, CheckCircle, XCircle, Briefcase,
  ChevronRight, DollarSign, User, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const ROLE_LABELS: Record<string, string> = {
  cook: "Cook", sous_chef: "Sous Chef", prep: "Prep Cook",
  dishwasher: "Dishwasher", cleaner: "Cleaner", server: "Server",
  bartender: "Bartender", host: "Host", manager: "Manager",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-300",
  accepted: "bg-green-500/20 text-green-300",
  rejected: "bg-red-500/20 text-red-300",
  confirmed: "bg-blue-500/20 text-blue-300",
  completed: "bg-primary/20 text-primary",
  cancelled: "bg-secondary text-muted-foreground",
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
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"worker" | "employer">("worker");

  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const { data: myApps, isLoading: appsLoading, refetch: refetchApps } = trpc.applications.myApplications.useQuery(undefined, { enabled: isAuthenticated });
  const { data: myJobs, isLoading: jobsLoading, refetch: refetchJobs } = trpc.jobs.myJobs.useQuery(undefined, { enabled: isAuthenticated });

  const isWorker = !profile?.userType || profile.userType === "worker" || profile.userType === "both";
  const isEmployer = profile?.userType === "employer" || profile?.userType === "both";

  const utils = trpc.useUtils();

  const acceptMutation = trpc.applications.accept.useMutation({
    onSuccess: () => {
      toast.success("Application accepted!");
      utils.applications.forJob.invalidate();
      utils.jobs.myJobs.invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rejectMutation = trpc.applications.reject.useMutation({
    onSuccess: () => {
      toast.success("Application declined.");
      utils.applications.forJob.invalidate();
      utils.jobs.myJobs.invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const markCompleteMutation = trpc.jobs.complete.useMutation({
    onSuccess: () => {
      toast.success("Shift marked as complete!");
      utils.jobs.myJobs.invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const releaseMutation = trpc.payments.releasePayment.useMutation({
    onSuccess: () => {
      toast.success("Payment released to worker!");
      utils.jobs.myJobs.invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (authLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-lg mx-auto">
        {/* Tabs */}
        <div className="sticky top-14 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
          <div className="flex gap-1 bg-secondary rounded-xl p-1">
            {isWorker && (
              <button
                onClick={() => setTab("worker")}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-semibold transition-colors",
                  tab === "worker" ? "bg-card text-foreground" : "text-muted-foreground"
                )}
              >
                My Applications
              </button>
            )}
            {isEmployer && (
              <button
                onClick={() => setTab("employer")}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-semibold transition-colors",
                  tab === "employer" ? "bg-card text-foreground" : "text-muted-foreground"
                )}
              >
                My Postings
              </button>
            )}
          </div>
        </div>

        <div className="px-4 py-4 space-y-3">
          {/* Worker: my applications */}
          {tab === "worker" && (
            <>
              {appsLoading ? (
                <LoadingSkeleton />
              ) : !myApps?.length ? (
                <EmptyState
                  icon={<Briefcase size={32} />}
                  title="No applications yet"
                  desc="Browse the live feed and apply to shifts"
                  action={{ label: "Browse Jobs", onClick: () => navigate("/feed") }}
                />
              ) : (
                myApps.map((app) => (
                  <WorkerApplicationCard key={app.id} app={app} navigate={navigate} />
                ))
              )}
            </>
          )}

          {/* Employer: my job postings */}
          {tab === "employer" && (
            <>
              <button
                onClick={() => navigate("/post-job")}
                className="w-full flex items-center justify-between bg-primary/10 border border-primary/30 rounded-2xl p-4"
              >
                <span className="font-bold text-sm">+ Post a New Shift</span>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>

              {jobsLoading ? (
                <LoadingSkeleton />
              ) : !myJobs?.length ? (
                <EmptyState
                  icon={<Briefcase size={32} />}
                  title="No jobs posted yet"
                  desc="Post your first shift to find workers"
                />
              ) : (
                myJobs.map((job) => (
                  <EmployerJobCard
                    key={job.id}
                    job={job}
                    onAccept={(appId) => acceptMutation.mutate({ applicationId: appId })}
                  onReject={(appId) => rejectMutation.mutate({ applicationId: appId })}
                    onMarkComplete={(jobId) => markCompleteMutation.mutate({ id: jobId })}
                    onRelease={(jobId) => releaseMutation.mutate({ jobId })}
                    responding={acceptMutation.isPending || rejectMutation.isPending}
                    releasing={releaseMutation.isPending}
                  />
                ))
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function WorkerApplicationCard({ app, navigate }: { app: any; navigate: any }) {
  const job = app.job;
  if (!job) return null;

  const hours = ((job.endTime - job.startTime) / 3600000).toFixed(1);
  const totalPay = parseFloat(job.payRate) * parseFloat(hours);

  return (
    <div
      className="bg-card rounded-2xl border border-border p-4 cursor-pointer hover:border-border/60 transition-colors"
      onClick={() => navigate(`/jobs/${job.id}`)}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-xs font-semibold bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
            {ROLE_LABELS[job.role] ?? job.role}
          </span>
          {job.restaurantName && <p className="font-bold mt-1">{job.restaurantName}</p>}
        </div>
        <span className={cn("text-xs font-bold px-2 py-1 rounded-full capitalize", STATUS_STYLES[app.status] ?? "bg-secondary text-muted-foreground")}>
          {app.status}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {formatDate(job.startTime)} · {formatTime(job.startTime)}–{formatTime(job.endTime)}
        </span>
        <span className="flex items-center gap-1">
          <DollarSign size={11} />
          ${job.payRate}/hr · ~${(totalPay * 0.9).toFixed(0)} yours
        </span>
      </div>

      {app.status === "accepted" && (
        <div className="mt-3 bg-green-500/10 border border-green-500/30 rounded-xl p-3">
          <p className="text-green-400 text-sm font-semibold flex items-center gap-2">
            <CheckCircle size={14} />
            Accepted! Payment required to confirm shift.
          </p>
        </div>
      )}

      {app.status === "confirmed" && (
        <div className="mt-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
          <p className="text-blue-400 text-sm font-semibold flex items-center gap-2">
            <CheckCircle size={14} />
            Shift confirmed — show up and get paid!
          </p>
        </div>
      )}

      {app.coverNote && (
        <p className="mt-2 text-xs text-muted-foreground italic">Your note: "{app.coverNote}"</p>
      )}

      <p className="text-xs text-muted-foreground mt-2">
        Applied {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
      </p>
    </div>
  );
}

function EmployerJobCard({
  job, onAccept, onReject, onMarkComplete, onRelease, responding, releasing
}: {
  job: any;
  onAccept: (appId: number) => void;
  onReject: (appId: number) => void;
  onMarkComplete: (jobId: number) => void;
  onRelease: (jobId: number) => void;
  responding: boolean;
  releasing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: apps } = trpc.applications.forJob.useQuery(
    { jobId: job.id },
    { enabled: expanded }
  );

  const hours = ((job.endTime - job.startTime) / 3600000).toFixed(1);
  const totalPay = parseFloat(job.payRate) * parseFloat(hours);
  const confirmedApp = apps?.find((a: any) => a.status === "confirmed");
  const pendingApps = apps?.filter((a: any) => a.status === "pending") ?? [];

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <button
        className="w-full p-4 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                {ROLE_LABELS[job.role] ?? job.role}
              </span>
              <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full capitalize", STATUS_STYLES[job.status] ?? "bg-secondary text-muted-foreground")}>
                {job.status}
              </span>
            </div>
            {job.restaurantName && <p className="font-bold mt-1">{job.restaurantName}</p>}
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDate(job.startTime)} · {formatTime(job.startTime)}–{formatTime(job.endTime)} ({hours}h)
            </p>
          </div>
          <div className="text-right">
            <p className="font-black text-primary">${job.payRate}/hr</p>
            <p className="text-xs text-muted-foreground">${totalPay.toFixed(0)} total</p>
          </div>
        </div>

        {/* Application count */}
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <User size={11} />
          <span>{job.applicationCount ?? 0} applicant(s)</span>
          <ChevronRight size={12} className={cn("ml-auto transition-transform", expanded && "rotate-90")} />
        </div>
      </button>

      {/* Expanded: applicants */}
      {expanded && (
        <div className="border-t border-border">
          {/* Payment + completion actions */}
          {job.status === "accepted" && !job.paymentId && (
            <div className="p-4 bg-yellow-500/5 border-b border-border">
              <p className="text-sm font-semibold text-yellow-400 flex items-center gap-2 mb-2">
                <AlertCircle size={14} />
                Payment required to confirm this shift
              </p>
              <PaymentButton jobId={job.id} totalPay={totalPay} />
            </div>
          )}

          {job.status === "confirmed" && !job.completedAt && (
            <div className="p-4 bg-blue-500/5 border-b border-border">
              <p className="text-sm text-muted-foreground mb-2">Mark shift as complete to release payment</p>
              <Button
                size="sm"
                className="w-full"
                onClick={() => onMarkComplete(job.id)}
              >
                Mark Shift Complete
              </Button>
            </div>
          )}

          {job.completedAt && !job.paymentReleasedAt && job.paymentId && (
            <div className="p-4 bg-green-500/5 border-b border-border">
              <p className="text-sm text-muted-foreground mb-2">Release payment to worker (90% of ${totalPay.toFixed(0)})</p>
              <Button
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => onRelease(job.id)}
                disabled={releasing}
              >
                {releasing ? "Releasing..." : `Release $${(totalPay * 0.9).toFixed(0)} to Worker`}
              </Button>
            </div>
          )}

          {/* Applicants list */}
          {!apps ? (
            <div className="p-4 flex justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : apps.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No applications yet</div>
          ) : (
            <div className="divide-y divide-border">
              {apps.map((app: any) => (
                <div key={app.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {app.worker?.profileImage ? (
                        <img src={app.worker.profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-muted-foreground">
                          {(app.worker?.name ?? "W")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm">{app.worker?.name ?? "Worker"}</p>
                        <div className="flex items-center gap-1">
                          <Star size={11} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-xs font-bold">{(app.worker?.rating ?? 5).toFixed(1)}</span>
                        </div>
                      </div>
                      {app.coverNote && (
                        <p className="text-xs text-muted-foreground mt-1 italic">"{app.coverNote}"</p>
                      )}
                      <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full capitalize mt-1 inline-block", STATUS_STYLES[app.status])}>
                        {app.status}
                      </span>
                    </div>
                  </div>

                  {app.status === "pending" && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => onAccept(app.id)}
                        disabled={responding}
                      >
                        <CheckCircle size={14} className="mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => onReject(app.id)}
                        disabled={responding}
                      >
                        <XCircle size={14} className="mr-1" />
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PaymentButton({ jobId, totalPay }: { jobId: number; totalPay: number }) {
  const utils = trpc.useUtils();
  const payMutation = trpc.payments.payForJob.useMutation({
    onSuccess: () => {
      toast.success("Payment processed! Shift confirmed.");
      utils.jobs.myJobs.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Button
      size="sm"
      className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
      onClick={() => payMutation.mutate({ jobId })}
      disabled={payMutation.isPending}
    >
      {payMutation.isPending ? "Processing..." : `Pay $${totalPay.toFixed(2)} (Escrow)`}
    </Button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card rounded-2xl h-32 animate-pulse border border-border" />
      ))}
    </div>
  );
}

function EmptyState({
  icon, title, desc, action
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 opacity-40">{icon}</div>
      <p className="font-bold mb-1">{title}</p>
      <p className="text-sm text-muted-foreground mb-4">{desc}</p>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}
