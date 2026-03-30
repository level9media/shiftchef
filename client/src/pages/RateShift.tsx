import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useLocation, useParams } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ChefHat, Star, CheckCircle2, Clock, MapPin, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

const RATING_LABELS: Record<number, string> = {
  5: "Absolutely",
  4: "Sure",
  3: "Maybe",
  2: "Not really",
  1: "Never",
};

const RATING_DESCRIPTIONS: Record<number, string> = {
  5: "Would hire/work with again without hesitation",
  4: "Would likely hire/work with again",
  3: "Neutral — might consider again",
  2: "Probably wouldn't hire/work with again",
  1: "Would not hire/work with again",
};

const RATING_COLORS: Record<number, string> = {
  5: "text-emerald-400",
  4: "text-green-400",
  3: "text-yellow-400",
  2: "text-orange-400",
  1: "text-red-400",
};

const STAR_COLORS: Record<number, string> = {
  5: "bg-emerald-500/20 border-emerald-500/40 text-emerald-400",
  4: "bg-green-500/20 border-green-500/40 text-green-400",
  3: "bg-yellow-500/20 border-yellow-500/40 text-yellow-400",
  2: "bg-orange-500/20 border-orange-500/40 text-orange-400",
  1: "bg-red-500/20 border-red-500/40 text-red-400",
};

const ROLE_LABELS: Record<string, string> = {
  cook: "Cook", sous_chef: "Sous Chef", prep: "Prep Cook",
  dishwasher: "Dishwasher", cleaner: "Cleaner", server: "Server",
  bartender: "Bartender", host: "Host", manager: "Manager",
};

export default function RateShift() {
  const { jobId } = useParams<{ jobId: string }>();
  const [, navigate] = useLocation();
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const jobIdNum = parseInt(jobId ?? "0", 10);

  const { data: context, isLoading } = trpc.ratings.jobRatingContext.useQuery(
    { jobId: jobIdNum },
    { enabled: !!jobIdNum }
  );

  const utils = trpc.useUtils();
  const submitMutation = trpc.ratings.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      utils.ratings.pendingRatings.invalidate();
      utils.ratings.given.invalidate();
      utils.ratings.forUser.invalidate({ userId: context?.otherUser?.id ?? 0 });
      utils.ratings.stats.invalidate({ userId: context?.otherUser?.id ?? 0 });
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-card rounded-2xl border border-border animate-pulse" />
          ))}
        </div>
      </AppShell>
    );
  }

  if (!context) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Shift not found or you don't have access.</p>
          <Button className="mt-4" onClick={() => navigate("/ratings")}>Back to Ratings</Button>
        </div>
      </AppShell>
    );
  }

  const { job, payment, myRating, otherUser, isEmployer, canRate } = context;

  const formatTime = (ms: number) =>
    new Date(ms).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  // Already rated
  if (myRating || submitted) {
    return (
      <AppShell>
        <SEOHead title="Rating Submitted — ShiftChef" canonicalPath={`/rate/${jobId}`} />
        <div className="max-w-lg mx-auto px-4 py-8">
          <button onClick={() => navigate("/ratings")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">Back to Ratings</span>
          </button>

          <div className="flex flex-col items-center py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
              <CheckCircle2 size={40} className="text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-2">Rating Submitted!</h2>
            <p className="text-muted-foreground max-w-xs">
              Your feedback helps build trust on the platform.
              {otherUser?.name && ` ${otherUser.name} has been notified.`}
            </p>
            {submitted && score !== null && (
              <div className={cn("mt-4 text-4xl font-black", RATING_COLORS[score])}>
                {score}★ — {RATING_LABELS[score]}
              </div>
            )}
            {myRating && (
              <div className={cn("mt-4 text-4xl font-black", RATING_COLORS[myRating.score])}>
                {myRating.score}★ — {RATING_LABELS[myRating.score]}
              </div>
            )}
            <div className="flex gap-3 mt-8">
              <Button variant="outline" className="rounded-2xl" onClick={() => navigate("/ratings")}>
                View All Ratings
              </Button>
              <Button className="rounded-2xl btn-glow" onClick={() => navigate("/feed")}>
                Find More Shifts
              </Button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // Cannot rate yet
  if (!canRate) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-4 py-8">
          <button onClick={() => navigate("/ratings")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">Back to Ratings</span>
          </button>
          <div className="bg-card rounded-2xl border border-border p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Clock size={24} className="text-muted-foreground" />
            </div>
            <h3 className="font-bold text-foreground mb-2">Rating Not Available Yet</h3>
            <p className="text-sm text-muted-foreground">
              {job.status !== "completed"
                ? "This shift hasn't been completed yet."
                : "Payment must be released before ratings are unlocked."}
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SEOHead title="Rate This Shift — ShiftChef" canonicalPath={`/rate/${jobId}`} />
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Back */}
        <button onClick={() => navigate("/ratings")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={16} />
          <span className="text-sm font-medium">Back to Ratings</span>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Rate This Shift
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isEmployer ? "How did the worker perform?" : "How was working with this employer?"}
          </p>
        </div>

        {/* Shift summary card */}
        <div className="bg-card rounded-2xl border border-border p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Briefcase size={16} className="text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">
                {ROLE_LABELS[job.role] ?? job.role}
                {job.restaurantName ? ` at ${job.restaurantName}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatTime(job.startTime)} — {new Date(job.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin size={10} />{job.location}</span>
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              ${job.payRate}/hr
            </span>
          </div>
        </div>

        {/* Person being rated */}
        <div className="bg-card rounded-2xl border border-border p-4 mb-6">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
            {isEmployer ? "Worker" : "Employer"}
          </p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
              {otherUser?.profileImage ? (
                <img src={otherUser.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <ChefHat size={18} className="text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="font-bold text-foreground">{otherUser?.name ?? "Unknown"}</p>
              {otherUser?.rating && otherUser.rating > 0 && (
                <p className="text-xs text-muted-foreground">
                  {otherUser.rating.toFixed(1)}★ avg · {otherUser.totalRatings ?? 0} ratings
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Rating question */}
        <div className="mb-6">
          <p className="text-sm font-bold text-foreground mb-1">
            Would you {isEmployer ? "hire" : "work with"} them again?
          </p>
          <p className="text-xs text-muted-foreground mb-4">Select a rating below</p>

          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((s) => (
              <button
                key={s}
                onClick={() => setScore(s)}
                className={cn(
                  "w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all",
                  score === s
                    ? STAR_COLORS[s]
                    : "bg-card border-border hover:border-primary/40 hover:bg-secondary/60"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0 transition-all",
                  score === s ? "bg-white/10" : "bg-secondary"
                )}>
                  {s}★
                </div>
                <div className="text-left">
                  <p className={cn("font-bold text-sm", score === s ? "" : "text-foreground")}>
                    {RATING_LABELS[s]}
                  </p>
                  <p className={cn("text-xs", score === s ? "opacity-80" : "text-muted-foreground")}>
                    {RATING_DESCRIPTIONS[s]}
                  </p>
                </div>
                {score === s && (
                  <CheckCircle2 size={18} className="ml-auto flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div className="mb-6">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
            Add a comment <span className="normal-case font-normal">(optional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={isEmployer
              ? "Describe their punctuality, skill, attitude..."
              : "Describe the work environment, communication, pay accuracy..."}
            className="w-full bg-card border border-border rounded-2xl p-4 text-sm resize-none h-28 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground transition-colors"
            maxLength={1000}
          />
          <p className="text-right text-[10px] text-muted-foreground mt-1">{comment.length}/1000</p>
        </div>

        {/* Submit */}
        <Button
          className="w-full h-14 text-base font-bold rounded-2xl btn-glow"
          disabled={score === null || submitMutation.isPending}
          onClick={() => {
            if (score !== null) {
              submitMutation.mutate({ jobId: jobIdNum, score, comment: comment || undefined });
            }
          }}
        >
          {submitMutation.isPending ? (
            <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <>Submit Rating {score !== null && `— ${RATING_LABELS[score]}`}</>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-3">
          Ratings are visible on public profiles and help build platform trust.
        </p>
      </div>
    </AppShell>
  );
}
