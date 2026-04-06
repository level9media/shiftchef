import { trpc } from "@/lib/trpc";
import AppShell from "@/components/AppShell";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ChefHat, Star, Users, Clock, CheckCircle, XCircle,
  Phone, ChevronRight, ChevronLeft, Plus, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  live:      { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Live" },
  filled:    { bg: "bg-blue-500/10",    text: "text-blue-400",    label: "Filled" },
  completed: { bg: "bg-orange-500/10",  text: "text-orange-400",  label: "Completed" },
  expired:   { bg: "bg-white/5",        text: "text-white/30",    label: "Expired" },
  cancelled: { bg: "bg-red-500/10",     text: "text-red-400",     label: "Cancelled" },
};

function maskName(name: string | null | undefined): string {
  if (!name) return "Worker";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1][0]}.`;
}

export default function EmployerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { isSpanish } = useLanguage();
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [tab, setTab] = useState<"live" | "history">("live");

  const { data: history, isLoading, refetch } = trpc.employerDashboard.history.useQuery(undefined, {
    enabled: !!user,
  });

  const acceptMutation = trpc.applications.accept.useMutation({
    onSuccess: () => {
      toast.success("Worker hired! They've been notified.");
      refetch();
      setSelectedJobId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const rejectMutation = trpc.applications.reject.useMutation({
    onSuccess: () => { refetch(); },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (isAuthenticated === false) navigate("/");
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  const liveJobs = (history ?? []).filter((j: any) => j.status === "live");
  const pastJobs = (history ?? []).filter((j: any) => j.status !== "live");
  const selectedJob = selectedJobId ? (history ?? []).find((j: any) => j.id === selectedJobId) : null;

  if (selectedJob) {
    const isHired = selectedJob.status === "filled";
    const apps = (selectedJob as any).applicants ?? [];

    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-4 py-6">
          <button
            onClick={() => setSelectedJobId(null)}
            className="flex items-center gap-2 text-sm text-white/50 mb-5 active:text-white/80"
          >
            <ChevronLeft size={16} /> Back to dashboard
          </button>

          <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-4 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-black text-white">{selectedJob.role}</h2>
                <p className="text-sm text-white/50">{selectedJob.restaurantName ?? "Your restaurant"}</p>
                <p className="text-xs text-white/40 mt-1">
                  {selectedJob.startTime ? format(new Date(Number(selectedJob.startTime)), "MMM d · h:mm a") : "—"}
                  {selectedJob.endTime ? ` – ${format(new Date(Number(selectedJob.endTime)), "h:mm a")}` : ""}
                </p>
              </div>
              <span className={cn("text-[10px] font-black px-2 py-1 rounded-full",
                STATUS_COLORS[selectedJob.status]?.bg, STATUS_COLORS[selectedJob.status]?.text
              )}>
                {STATUS_COLORS[selectedJob.status]?.label}
              </span>
            </div>
          </div>

          {isHired ? (
            <div>
              <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Hired Worker</p>
              {selectedJob.worker ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-lg font-black text-emerald-400">
                      {((selectedJob.worker as any).name ?? "W")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-white">{(selectedJob.worker as any).name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star size={11} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-yellow-400 font-bold">
                          {(selectedJob.worker as any).rating ? parseFloat(String((selectedJob.worker as any).rating)).toFixed(1) : "New"}
                        </span>
                        <CheckCircle size={11} className="text-emerald-400 ml-1" />
                        <span className="text-xs text-emerald-400 font-bold">Hired</span>
                      </div>
                    </div>
                  </div>
                  {(selectedJob.worker as any).phone && (
                    
                     <a ef={`tel:${(selectedJob.worker as any).phone}`}
                      className="w-full h-11 rounded-xl bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2"
                    >
                      <Phone size={15} /> Call / Text {(selectedJob.worker as any).phone}
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm text-white/40">Worker info unavailable.</p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">
                {apps.length} Applicant{apps.length !== 1 ? "s" : ""}
              </p>
              {apps.length === 0 ? (
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-8 text-center">
                  <Users size={28} className="text-white/20 mx-auto mb-3" />
                  <p className="text-sm text-white/40">No applicants yet. Check back soon.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {apps.map((app: any) => {
                    const worker = app.worker;
                    const isPending = app.status === "pending";
                    const isAccepted = app.status === "accepted";
                    const isRejected = app.status === "rejected";

                    return (
                      <div
                        key={app.id}
                        className={cn(
                          "rounded-2xl border p-4",
                          isAccepted ? "bg-emerald-500/10 border-emerald-500/20" :
                          isRejected ? "bg-white/[0.02] border-white/5 opacity-50" :
                          "bg-white/[0.04] border-white/8"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/20 flex items-center justify-center text-lg font-black text-[#FF6B00] flex-shrink-0">
                            {(worker?.name ?? "W")[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-white text-sm">
                              {maskName(worker?.name)}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {worker?.rating && (
                                <div className="flex items-center gap-0.5">
                                  <Star size={10} className="text-yellow-400 fill-yellow-400" />
                                  <span className="text-xs text-yellow-400 font-bold">
                                    {parseFloat(String(worker.rating)).toFixed(1)}
                                  </span>
                                </div>
                              )}
                              {worker?.verificationStatus === "verified" && (
                                <div className="flex items-center gap-0.5">
                                  <Shield size={10} className="text-blue-400" />
                                  <span className="text-[10px] text-blue-400 font-bold">Verified</span>
                                </div>
                              )}
                              {worker?.yearsExperience > 0 && (
                                <span className="text-[10px] text-white/40">{worker.yearsExperience}yr exp</span>
                              )}
                              {worker?.specialty && (
                                <span className="text-[10px] text-white/40">{worker.specialty}</span>
                              )}
                            </div>
                            {app.coverNote && (
                              <p className="text-xs text-white/50 mt-1.5 italic">"{app.coverNote}"</p>
                            )}
                          </div>
                        </div>

                        {isPending && (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => acceptMutation.mutate({ applicationId: app.id })}
                              disabled={acceptMutation.isPending}
                              className="flex-1 h-10 rounded-xl bg-[#FF6B00] text-white font-bold text-sm flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform disabled:opacity-40"
                            >
                              <CheckCircle size={14} /> Hire
                            </button>
                            <button
                              onClick={() => rejectMutation.mutate({ applicationId: app.id })}
                              disabled={rejectMutation.isPending}
                              className="flex-1 h-10 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold text-sm flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform disabled:opacity-40"
                            >
                              <XCircle size={14} /> Pass
                            </button>
                          </div>
                        )}
                        {isAccepted && (
                          <div className="mt-3 flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                            <CheckCircle size={13} /> Hired
                          </div>
                        )}
                        {isRejected && (
                          <div className="mt-3 flex items-center gap-1.5 text-white/30 text-xs font-bold">
                            <XCircle size={13} /> Passed
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SEOHead title="Employer Dashboard — ShiftChef" canonicalPath="/employer-dashboard" />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white">My Shifts</h1>
            <p className="text-xs text-white/40 mt-0.5">Manage your postings and applicants</p>
          </div>
          <button
            onClick={() => navigate("/post-job")}
            className="h-9 px-4 rounded-xl bg-[#FF6B00] text-white font-bold text-xs flex items-center gap-1.5"
          >
            <Plus size={14} /> Post Shift
          </button>
        </div>

        <div className="flex gap-1 bg-white/[0.04] rounded-xl p-1">
          {(["live", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 h-8 rounded-lg text-xs font-bold transition-all",
                tab === t ? "bg-[#FF6B00] text-white" : "text-white/40"
              )}
            >
              {t === "live" ? `Live (${liveJobs.length})` : `History (${pastJobs.length})`}
            </button>
          ))}
        </div>

        {tab === "live" && (
          <div className="space-y-3">
            {liveJobs.length === 0 ? (
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-8 text-center">
                <ChefHat size={28} className="text-white/20 mx-auto mb-3" />
                <p className="text-sm font-bold text-white">No live shifts</p>
                <p className="text-xs text-white/40 mt-1">Post a shift to start getting applicants</p>
                <button
                  onClick={() => navigate("/post-job")}
                  className="mt-4 h-10 px-6 rounded-xl bg-[#FF6B00] text-white font-bold text-sm"
                >
                  Post a Shift
                </button>
              </div>
            ) : (
              liveJobs.map((job: any) => (
                <JobCard key={job.id} job={job} onClick={() => setSelectedJobId(job.id)} />
              ))
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-3">
            {pastJobs.length === 0 ? (
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-8 text-center">
                <p className="text-sm text-white/40">No past shifts yet.</p>
              </div>
            ) : (
              pastJobs.map((job: any) => (
                <JobCard key={job.id} job={job} onClick={() => setSelectedJobId(job.id)} />
              ))
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function JobCard({ job, onClick }: { job: any; onClick: () => void }) {
  const statusCfg = STATUS_COLORS[job.status] ?? STATUS_COLORS.expired;
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white/[0.04] border border-white/8 rounded-2xl p-4 active:scale-[0.99] transition-transform"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-black text-white text-sm">{job.role}</p>
          <p className="text-xs text-white/50">{job.restaurantName ?? "Your restaurant"}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full", statusCfg.bg, statusCfg.text)}>
            {statusCfg.label}
          </span>
          <ChevronRight size={14} className="text-white/30" />
        </div>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-white/40">
        <div className="flex items-center gap-1">
          <Clock size={10} />
          {job.startTime ? format(new Date(Number(job.startTime)), "MMM d · h:mm a") : "—"}
        </div>
        <div className="flex items-center gap-1">
          <Users size={10} />
          {job.applicantCount ?? 0} applicant{job.applicantCount !== 1 ? "s" : ""}
        </div>
      </div>
    </button>
  );
}