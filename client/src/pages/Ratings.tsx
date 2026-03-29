import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Star, MessageSquare, CheckCircle, Lock, ChefHat } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const RATING_LABELS: Record<number, string> = {
  5: "Absolutely",
  4: "Sure",
  3: "Maybe",
  2: "Not really",
  1: "Never",
};

const RATING_COLORS: Record<number, string> = {
  5: "text-emerald-400",
  4: "text-green-400",
  3: "text-yellow-400",
  2: "text-orange-400",
  1: "text-red-400",
};

export default function Ratings() {
  const { isAuthenticated, user } = useAuth();
  const [tab, setTab] = useState<"pending" | "received">("pending");

  const { data: pendingRatings, isLoading: pendingLoading, refetch } = trpc.ratings.pendingRatings.useQuery(
    undefined, { enabled: isAuthenticated }
  );
  const { data: myRatings, isLoading: myLoading } = trpc.ratings.forUser.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: isAuthenticated && !!user?.id }
  );

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
            <button
              onClick={() => setTab("pending")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all",
                tab === "pending" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              <Star size={11} strokeWidth={2.5} /> Rate Now
              {(pendingRatings?.length ?? 0) > 0 && (
                <span className="bg-primary text-primary-foreground text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {pendingRatings!.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("received")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all",
                tab === "received" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              <MessageSquare size={11} strokeWidth={2.5} /> Received
            </button>
          </div>
        </div>

        <div className="px-4 py-4 space-y-3">
          {/* Info banner */}
          <div className="bg-card rounded-2xl border border-border p-3 flex items-start gap-2">
            <Lock size={13} className="text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Ratings unlock only after payment is released. Both parties rate each other.
            </p>
          </div>

          {/* ── Pending ─────────────────────────────────────────────────── */}
          {tab === "pending" && (
            <>
              {pendingLoading ? <Skeletons /> :
                !pendingRatings?.length ? (
                  <EmptyState
                    icon={<Star size={36} className="text-muted-foreground/30" />}
                    title="No pending ratings"
                    desc="Complete shifts and release payments to unlock ratings"
                  />
                ) : (
                  pendingRatings.map((item: any) => (
                    <RatingForm key={`${item.jobId}-${item.rateUserId}`} item={item} onDone={refetch} />
                  ))
                )
              }
            </>
          )}

          {/* ── Received ────────────────────────────────────────────────── */}
          {tab === "received" && (
            <>
              {myLoading ? <Skeletons /> :
                !myRatings?.length ? (
                  <EmptyState
                    icon={<Star size={36} className="text-muted-foreground/30" />}
                    title="No ratings yet"
                    desc="Your ratings will appear here after shifts are completed"
                  />
                ) : (
                  myRatings.map((rating: any) => (
                    <ReceivedRatingCard key={rating.id} rating={rating} />
                  ))
                )
              }
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function RatingForm({ item, onDone }: { item: any; onDone: () => void }) {
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = trpc.ratings.submit.useMutation({
    onSuccess: () => { setSubmitted(true); toast.success("Rating submitted!"); onDone(); },
    onError: (e) => toast.error(e.message),
  });

  if (submitted) {
    return (
      <div className="bg-card rounded-2xl border border-emerald-500/30 p-5 flex items-center gap-3">
        <CheckCircle size={20} className="text-emerald-400" />
        <p className="font-bold text-sm text-foreground">Rating submitted for {item.rateName ?? "user"}</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
      {/* Who to rate */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
          {item.rateUserImage ? (
            <img src={item.rateUserImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <ChefHat size={18} className="text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="font-black text-foreground">{item.rateName ?? "User"}</p>
          <p className="text-xs text-muted-foreground">
            {item.jobRole} {item.restaurantName ? `· ${item.restaurantName}` : ""}
          </p>
          {item.shiftDate && <p className="text-[10px] text-muted-foreground">{item.shiftDate}</p>}
        </div>
      </div>

      {/* Question */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Would you work with them again?
        </p>
        <div className="flex gap-1.5">
          {[5, 4, 3, 2, 1].map((val) => (
            <button
              key={val}
              onClick={() => setScore(val)}
              className={cn(
                "flex-1 py-3 rounded-xl border text-xs font-black transition-all flex flex-col items-center gap-1",
                score === val
                  ? `border-primary bg-primary/10 ${RATING_COLORS[val]}`
                  : "border-border bg-secondary text-muted-foreground"
              )}
            >
              <span className="text-sm">{val}</span>
              <span className="text-[8px] leading-tight text-center">{RATING_LABELS[val]}</span>
            </button>
          ))}
        </div>
        {score !== null && (
          <p className={cn("text-center text-sm font-bold mt-2", RATING_COLORS[score])}>
            {score}★ — {RATING_LABELS[score]}
          </p>
        )}
      </div>

      {/* Feedback */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Feedback (optional)</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
          className="w-full bg-secondary border border-border rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
          maxLength={500}
        />
      </div>

      <Button
        className="w-full h-12 font-bold rounded-2xl btn-glow"
        disabled={score === null || submitMutation.isPending}
        onClick={() => {
          if (score !== null) submitMutation.mutate({ jobId: item.jobId, score, comment: comment || undefined });
        }}
      >
        {submitMutation.isPending ? (
          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
        ) : "Submit Rating"}
      </Button>
    </div>
  );
}

function ReceivedRatingCard({ rating }: { rating: any }) {
  const [showReply, setShowReply] = useState(false);
  const [reply, setReply] = useState(rating.employerResponse ?? "");
  const [saved, setSaved] = useState(false);

  const respondMutation = trpc.ratings.respond.useMutation({
    onSuccess: () => { setSaved(true); toast.success("Response saved!"); },
    onError: (e) => toast.error(e.message),
  });

  const color = RATING_COLORS[rating.score as number] ?? "text-muted-foreground";

  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
            {rating.rater?.profileImage ? (
              <img src={rating.rater.profileImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <ChefHat size={14} className="text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">{rating.rater?.name ?? "User"}</p>
            <p className="text-[10px] text-muted-foreground">
              {new Date(rating.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
          <p className={cn("text-2xl font-black", color)}>{rating.score}★</p>
          <p className={cn("text-[10px] font-bold", color)}>{RATING_LABELS[rating.score as number]}</p>
        </div>
      </div>

      {rating.comment && (
        <p className="text-sm text-muted-foreground italic border-t border-border pt-2">
          "{rating.comment}"
        </p>
      )}

      {/* Employer response */}
      {rating.response && !showReply && (
        <div className="bg-secondary rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground font-bold mb-1">YOUR RESPONSE</p>
          <p className="text-sm text-foreground">{rating.response}</p>
        </div>
      )}
      {!rating.response && !showReply && !saved && (
        <button onClick={() => setShowReply(true)} className="text-xs text-primary font-bold">
          + Add response
        </button>
      )}
      {showReply && !saved && (
        <div className="space-y-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Respond to this rating..."
            className="w-full bg-secondary border border-border rounded-xl p-3 text-sm resize-none h-16 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
            maxLength={500}
          />
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 rounded-xl" disabled={!reply || respondMutation.isPending}
              onClick={() => respondMutation.mutate({ ratingId: rating.id, response: reply })}>
              {respondMutation.isPending ? "Saving..." : "Save"}
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setShowReply(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Skeletons() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="bg-card rounded-2xl border border-border p-5 space-y-3 animate-pulse">
          <div className="flex gap-3">
            <div className="w-12 h-12 bg-secondary rounded-2xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-secondary rounded-lg w-1/2" />
              <div className="h-3 bg-secondary rounded-lg w-1/3" />
            </div>
          </div>
          <div className="h-16 bg-secondary rounded-xl" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="mb-3">{icon}</div>
      <p className="font-bold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">{desc}</p>
    </div>
  );
}
