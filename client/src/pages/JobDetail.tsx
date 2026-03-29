import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import AppShell from "@/components/AppShell";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Clock, MapPin, Star, TrendingUp, Flag, DollarSign, User, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState } from "react";

const ROLE_LABELS: Record<string, string> = {
  cook: "Cook", sous_chef: "Sous Chef", prep: "Prep Cook",
  dishwasher: "Dishwasher", cleaner: "Cleaner", server: "Server",
  bartender: "Bartender", host: "Host", manager: "Manager",
};

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}
function calcHours(start: number, end: number) {
  return ((end - start) / (1000 * 60 * 60)).toFixed(1);
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [coverNote, setCoverNote] = useState("");
  const [applied, setApplied] = useState(false);

  const { data: job, isLoading } = trpc.jobs.get.useQuery({ id: parseInt(id ?? "0") });
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const utils = trpc.useUtils();

  const applyMutation = trpc.applications.applyToJob.useMutation({
    onSuccess: () => {
      setApplied(true);
      toast.success("Application submitted!");
      utils.applications.myApplications.invalidate();
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

  if (!job) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">Job not found</p>
          <Button onClick={() => navigate("/feed")}>Back to Feed</Button>
        </div>
      </AppShell>
    );
  }

  const hours = calcHours(job.startTime, job.endTime);
  const totalPay = job.totalPay ? parseFloat(job.totalPay) : parseFloat(job.payRate) * parseFloat(hours);
  const workerRating = profile?.rating ?? 5;
  const belowMin = job.minRating && workerRating < job.minRating;
  const isWorker = !profile?.userType || profile.userType === "worker" || profile.userType === "both";
  const isOwnJob = profile?.id === job.employerId;
  const isExpired = job.status !== "live";

  return (
    <AppShell>
      <div className="max-w-lg mx-auto">
        {/* Back button */}
        <div className="px-4 pt-4">
          <button
            onClick={() => navigate("/feed")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Back to Feed</span>
          </button>
        </div>

        {/* Hero image */}
        <div className="relative h-48 mx-4 mt-4 rounded-2xl overflow-hidden bg-secondary flex items-center justify-center">
          {job.restaurantImage ? (
            <img src={job.restaurantImage} alt={job.restaurantName ?? ""} className="w-full h-full object-cover" />
          ) : (
            <span className="text-6xl">🍽️</span>
          )}
          <div className="absolute top-3 left-3">
            {job.isPermanent ? (
              <span className="flex items-center gap-1 bg-green-500/90 text-white text-xs font-bold px-2 py-1 rounded-full">
                <TrendingUp size={10} />
                Permanent Potential
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-orange-500/90 text-white text-xs font-bold px-2 py-1 rounded-full">
                <Flag size={10} />
                Temporary
              </span>
            )}
          </div>
          {isExpired && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <span className="bg-destructive text-destructive-foreground font-bold px-4 py-2 rounded-xl text-sm uppercase tracking-wide">
                {job.status}
              </span>
            </div>
          )}
        </div>

        {/* Job info */}
        <div className="px-4 py-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-black">{ROLE_LABELS[job.role] ?? job.role}</h1>
              {job.restaurantName && <p className="text-muted-foreground">{job.restaurantName}</p>}
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-primary">${job.payRate}/hr</p>
              <p className="text-sm text-muted-foreground">~${totalPay.toFixed(0)} total</p>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            <InfoCard icon={<Clock size={16} className="text-primary" />} label="Shift Time">
              <p className="font-semibold text-sm">{formatDate(job.startTime)}</p>
              <p className="text-xs text-muted-foreground">{formatTime(job.startTime)} – {formatTime(job.endTime)} ({hours}h)</p>
            </InfoCard>

            {job.location && (
              <InfoCard icon={<MapPin size={16} className="text-primary" />} label="Location">
                <p className="font-semibold text-sm">{job.location}</p>
                <p className="text-xs text-muted-foreground">{job.city}</p>
              </InfoCard>
            )}

            <InfoCard icon={<DollarSign size={16} className="text-green-400" />} label="Your Payout">
              <p className="font-semibold text-sm">${(totalPay * 0.9).toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">After 10% platform fee</p>
            </InfoCard>

            {(job.minRating ?? 0) > 0 && (
              <InfoCard icon={<Star size={16} className="text-yellow-400" />} label="Min Rating">
                <p className={cn("font-semibold text-sm", belowMin ? "text-destructive" : "text-foreground")}>
                  {job.minRating}★ required
                </p>
                <p className="text-xs text-muted-foreground">Your rating: {workerRating.toFixed(1)}★</p>
              </InfoCard>
            )}
          </div>

          {/* Description */}
          {job.description && (
            <div className="bg-card rounded-2xl p-4 border border-border">
              <h3 className="font-bold text-sm mb-2">About this shift</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{job.description}</p>
            </div>
          )}

          {/* Apply section */}
          {isWorker && !isOwnJob && !isExpired && (
            <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
              <h3 className="font-bold">Apply for this shift</h3>

              {belowMin && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3">
                  <p className="text-destructive text-sm font-medium">
                    Your rating ({workerRating.toFixed(1)}) is below the minimum required ({job.minRating}).
                  </p>
                </div>
              )}

              {!applied && !belowMin && (
                <textarea
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Add a note (optional) — introduce yourself, your experience..."
                  className="w-full bg-secondary border border-border rounded-xl p-3 text-sm resize-none h-24 focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                  maxLength={500}
                />
              )}

              {applied ? (
                <div className="flex items-center gap-2 text-green-400 font-semibold">
                  <CheckCircle size={18} />
                  Application submitted! Employer will review soon.
                </div>
              ) : (
                <Button
                  size="lg"
                  className="w-full h-14 text-base font-bold rounded-2xl"
                  disabled={!!belowMin || applyMutation.isPending || !isAuthenticated}
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.error("Please sign in to apply");
                      return;
                    }
                    applyMutation.mutate({ jobId: job.id, coverNote: coverNote || undefined });
                  }}
                >
                  {applyMutation.isPending ? "Applying..." : "Apply Now"}
                </Button>
              )}

              {!isAuthenticated && (
                <p className="text-xs text-muted-foreground text-center">
                  <a href="/" className="text-primary underline">Sign in</a> to apply
                </p>
              )}
            </div>
          )}

          {isOwnJob && (
            <div className="bg-card rounded-2xl p-4 border border-border">
              <p className="text-sm text-muted-foreground text-center">This is your job posting.</p>
              <Button
                variant="outline"
                className="w-full mt-3"
                onClick={() => navigate("/applications")}
              >
                View Applicants
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function InfoCard({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl p-3 border border-border">
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      {children}
    </div>
  );
}
