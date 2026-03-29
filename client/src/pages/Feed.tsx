import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppShell from "@/components/AppShell";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import {
  MapPin, Clock, DollarSign, Star, TrendingUp, Flag,
  Zap, ChevronRight, Plus, RefreshCw, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const CITIES = ["Austin, TX", "Houston, TX", "Dallas, TX", "San Antonio, TX", "New York, NY"];

const ROLE_LABELS: Record<string, string> = {
  cook: "Cook", sous_chef: "Sous Chef", prep: "Prep Cook",
  dishwasher: "Dishwasher", cleaner: "Cleaner", server: "Server",
  bartender: "Bartender", host: "Host", manager: "Manager",
};

const ROLE_COLORS: Record<string, string> = {
  cook: "bg-orange-500/20 text-orange-300",
  sous_chef: "bg-red-500/20 text-red-300",
  prep: "bg-yellow-500/20 text-yellow-300",
  dishwasher: "bg-blue-500/20 text-blue-300",
  cleaner: "bg-green-500/20 text-green-300",
  server: "bg-purple-500/20 text-purple-300",
  bartender: "bg-pink-500/20 text-pink-300",
  host: "bg-cyan-500/20 text-cyan-300",
  manager: "bg-indigo-500/20 text-indigo-300",
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

function calcHours(start: number, end: number) {
  return ((end - start) / (1000 * 60 * 60)).toFixed(1);
}

export default function Feed() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [city, setCity] = useState("Austin, TX");
  const [tab, setTab] = useState<"jobs" | "workers">("jobs");

  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated, retry: false });

  const { data: jobs, isLoading: jobsLoading, refetch: refetchJobs } = trpc.jobs.list.useQuery(
    { city },
    { refetchInterval: 30000 }
  );

  const { data: availableWorkers, isLoading: workersLoading, refetch: refetchWorkers } = trpc.availability.list.useQuery(
    { city },
    { refetchInterval: 30000 }
  );

  const isEmployer = profile?.userType === "employer" || profile?.userType === "both";
  const isWorker = !profile?.userType || profile.userType === "worker" || profile.userType === "both";

  const handleRefresh = () => {
    refetchJobs();
    refetchWorkers();
    toast.success("Feed refreshed");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="max-w-lg mx-auto">
        {/* City selector + refresh */}
        <div className="sticky top-14 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 overflow-x-auto scrollbar-none">
              <div className="flex gap-2 pb-1">
                {CITIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCity(c)}
                    className={cn(
                      "whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex-shrink-0",
                      city === c
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="p-1.5 rounded-full bg-secondary text-muted-foreground hover:text-foreground flex-shrink-0"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 bg-secondary rounded-xl p-1">
            <button
              onClick={() => setTab("jobs")}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-semibold transition-colors",
                tab === "jobs" ? "bg-card text-foreground" : "text-muted-foreground"
              )}
            >
              <span className="flex items-center justify-center gap-1.5">
                <Zap size={14} />
                Live Jobs {jobs?.length ? `(${jobs.length})` : ""}
              </span>
            </button>
            <button
              onClick={() => setTab("workers")}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-semibold transition-colors",
                tab === "workers" ? "bg-card text-foreground" : "text-muted-foreground"
              )}
            >
              <span className="flex items-center justify-center gap-1.5">
                <User size={14} />
                Workers {availableWorkers?.length ? `(${availableWorkers.length})` : ""}
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-4 space-y-3">
          {/* Employer: post job CTA */}
          {isEmployer && tab === "jobs" && (
            <button
              onClick={() => navigate("/post-job")}
              className="w-full flex items-center justify-between bg-primary/10 border border-primary/30 rounded-2xl p-4 hover:bg-primary/15 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <Plus size={20} className="text-primary-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">Post a Shift</p>
                  <p className="text-xs text-muted-foreground">From $35 · Unlimited with subscription</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
          )}

          {/* Worker: post availability CTA */}
          {isWorker && tab === "workers" && (
            <button
              onClick={() => navigate("/availability")}
              className="w-full flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-2xl p-4 hover:bg-green-500/15 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                  <Plus size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">Post Availability</p>
                  <p className="text-xs text-muted-foreground">Let employers find you</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
          )}

          {/* Jobs tab */}
          {tab === "jobs" && (
            <>
              {jobsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-card rounded-2xl h-48 animate-pulse border border-border" />
                  ))}
                </div>
              ) : !jobs?.length ? (
                <EmptyState
                  icon={<Zap size={32} className="text-muted-foreground" />}
                  title="No live jobs in this city"
                  desc="Check back soon or try another city"
                />
              ) : (
                jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    workerRating={profile?.rating ?? 5}
                    isWorker={isWorker}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  />
                ))
              )}
            </>
          )}

          {/* Workers tab */}
          {tab === "workers" && (
            <>
              {workersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-card rounded-2xl h-32 animate-pulse border border-border" />
                  ))}
                </div>
              ) : !availableWorkers?.length ? (
                <EmptyState
                  icon={<User size={32} className="text-muted-foreground" />}
                  title="No workers available right now"
                  desc="Workers can post their availability here"
                />
              ) : (
                availableWorkers.map((post) => (
                  <WorkerCard key={post.id} post={post} isEmployer={isEmployer} />
                ))
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function JobCard({
  job,
  workerRating,
  isWorker,
  onClick,
}: {
  job: any;
  workerRating: number;
  isWorker: boolean;
  onClick: () => void;
}) {
  const hours = calcHours(job.startTime, job.endTime);
  const totalPay = job.totalPay ? parseFloat(job.totalPay) : parseFloat(job.payRate) * parseFloat(hours);
  const belowMin = isWorker && job.minRating > 0 && workerRating < job.minRating;

  return (
    <button
      onClick={onClick}
      className={cn(
        "job-card w-full bg-card rounded-2xl border border-border overflow-hidden text-left",
        belowMin && "opacity-60"
      )}
    >
      {/* Image / header */}
      <div className="relative h-32 bg-gradient-to-br from-secondary to-card flex items-center justify-center">
        {job.restaurantImage ? (
          <img src={job.restaurantImage} alt={job.restaurantName ?? ""} className="w-full h-full object-cover" />
        ) : (
          <div className="text-4xl">🍽️</div>
        )}
        {/* Permanent indicator */}
        <div className="absolute top-3 left-3">
          {job.isPermanent ? (
            <span className="flex items-center gap-1 bg-green-500/90 text-white text-xs font-bold px-2 py-1 rounded-full">
              <TrendingUp size={10} />
              Perm potential
            </span>
          ) : (
            <span className="flex items-center gap-1 bg-orange-500/90 text-white text-xs font-bold px-2 py-1 rounded-full">
              <Flag size={10} />
              Temp
            </span>
          )}
        </div>
        {/* Pay badge */}
        <div className="absolute top-3 right-3 bg-background/90 backdrop-blur rounded-xl px-2.5 py-1">
          <span className="text-sm font-black text-foreground">${job.payRate}/hr</span>
        </div>
        {/* Live dot */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-background/80 backdrop-blur rounded-full px-2 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", ROLE_COLORS[job.role] ?? "bg-secondary text-foreground")}>
              {ROLE_LABELS[job.role] ?? job.role}
            </span>
            {job.restaurantName && (
              <p className="font-bold mt-1 text-sm">{job.restaurantName}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-primary">${totalPay.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">total est.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {formatDate(job.startTime)} · {formatTime(job.startTime)} – {formatTime(job.endTime)} ({hours}h)
          </span>
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin size={11} />
              {job.location}
            </span>
          )}
          {job.minRating > 0 && (
            <span className={cn("flex items-center gap-1", belowMin && "text-destructive")}>
              <Star size={11} />
              Min {job.minRating}★ required
            </span>
          )}
        </div>

        {belowMin && (
          <p className="mt-2 text-xs text-destructive font-medium">
            Your rating ({workerRating.toFixed(1)}) is below the minimum
          </p>
        )}
      </div>
    </button>
  );
}

function WorkerCard({ post, isEmployer }: { post: any; isEmployer: boolean }) {
  const worker = post.worker;
  const skills: string[] = (() => {
    try { return JSON.parse(post.skills); } catch { return []; }
  })();

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-xl bg-secondary flex-shrink-0 overflow-hidden flex items-center justify-center">
          {worker?.profileImage ? (
            <img src={worker.profileImage} alt={worker.name ?? ""} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl font-bold text-muted-foreground">
              {(worker?.name ?? "W")[0].toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-bold text-sm truncate">{worker?.name ?? "Anonymous Worker"}</p>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-bold">{(worker?.rating ?? 5).toFixed(1)}</span>
            </div>
          </div>

          {post.location && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin size={10} />
              {post.location}
            </p>
          )}

          {/* Skills */}
          <div className="flex flex-wrap gap-1 mt-2">
            {skills.slice(0, 3).map((s) => (
              <span key={s} className={cn("text-xs px-2 py-0.5 rounded-full", ROLE_COLORS[s] ?? "bg-secondary text-muted-foreground")}>
                {ROLE_LABELS[s] ?? s}
              </span>
            ))}
          </div>

          {post.note && (
            <p className="text-xs text-muted-foreground mt-2 italic">"{post.note}"</p>
          )}
        </div>
      </div>

      {/* Availability badge */}
      <div className="mt-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-green-400 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
          Available Now
        </span>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 opacity-40">{icon}</div>
      <p className="font-bold text-foreground mb-1">{title}</p>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
