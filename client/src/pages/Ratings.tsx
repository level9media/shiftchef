import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import AppShell from "@/components/AppShell";
import { useState } from "react";
import { Star, MessageSquare, CheckCircle, Lock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Rating labels as specified
const RATING_LABELS: Record<number, string> = {
  5: "Absolutely",
  4: "Sure",
  3: "Maybe",
  2: "Not really",
  1: "Never",
};

const RATING_COLORS: Record<number, string> = {
  5: "text-green-400",
  4: "text-emerald-400",
  3: "text-yellow-400",
  2: "text-orange-400",
  1: "text-red-400",
};

export default function Ratings() {
  const { isAuthenticated, user } = useAuth();
  const { data: pendingRatings, isLoading: pendingLoading, refetch } = trpc.ratings.pendingRatings.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: myRatings, isLoading: myLoading } = trpc.ratings.forUser.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: isAuthenticated && !!user?.id }
  );

  const [tab, setTab] = useState<"pending" | "received">("pending");

  return (
    <AppShell>
      <div className="max-w-lg mx-auto">
        {/* Tabs */}
        <div className="sticky top-14 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
          <div className="flex gap-1 bg-secondary rounded-xl p-1">
            <button
              onClick={() => setTab("pending")}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-semibold transition-colors",
                tab === "pending" ? "bg-card text-foreground" : "text-muted-foreground"
              )}
            >
              Rate Now {pendingRatings?.length ? `(${pendingRatings.length})` : ""}
            </button>
            <button
              onClick={() => setTab("received")}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-semibold transition-colors",
                tab === "received" ? "bg-card text-foreground" : "text-muted-foreground"
              )}
            >
              My Ratings
            </button>
          </div>
        </div>

        <div className="px-4 py-4 space-y-3">
          {/* Info banner */}
          <div className="bg-card rounded-2xl border border-border p-3 flex items-start gap-2">
            <Lock size={14} className="text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Ratings are only unlocked after payment has been released. Both parties rate each other.
            </p>
          </div>

          {tab === "pending" && (
            <>
              {pendingLoading ? (
                <LoadingSkeleton />
              ) : !pendingRatings?.length ? (
                <EmptyState
                  icon={<Star size={32} />}
                  title="No ratings pending"
                  desc="Complete shifts and release payments to unlock ratings"
                />
              ) : (
                pendingRatings.map((item: any) => (
                  <RatingForm key={item.jobId + item.rateUserId} item={item} onDone={refetch} />
                ))
              )}
            </>
          )}

          {tab === "received" && (
            <>
              {myLoading ? (
                <LoadingSkeleton />
              ) : !myRatings?.length ? (
                <EmptyState
                  icon={<Star size={32} />}
                  title="No ratings yet"
                  desc="Your ratings will appear here after shifts are completed"
                />
              ) : (
                myRatings.map((rating: any) => (
                  <ReceivedRatingCard key={rating.id} rating={rating} />
                ))
              )}
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
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Rating submitted!");
      onDone();
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (submitted) {
    return (
      <div className="bg-card rounded-2xl border border-green-500/30 p-4 flex items-center gap-3">
        <CheckCircle size={20} className="text-green-400" />
        <p className="font-semibold text-sm">Rating submitted for {item.rateName}</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
          {item.rateUserImage ? (
            <img src={item.rateUserImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="font-bold text-muted-foreground">{(item.rateName ?? "U")[0].toUpperCase()}</span>
          )}
        </div>
        <div>
          <p className="font-bold text-sm">{item.rateName ?? "User"}</p>
          <p className="text-xs text-muted-foreground">{item.jobRole} · {item.restaurantName}</p>
          <p className="text-xs text-muted-foreground">{item.shiftDate}</p>
        </div>
      </div>

      {/* Question */}
      <div>
        <p className="font-semibold text-sm mb-3">
          Would you work with this person again?
        </p>

        {/* Rating buttons */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((val) => (
            <button
              key={val}
              onClick={() => setScore(val)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                score === val
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary hover:border-border/60"
              )}
            >
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={14}
                    className={cn(
                      s <= val ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                    )}
                  />
                ))}
              </div>
              <span className={cn("font-semibold text-sm", score === val ? RATING_COLORS[val] : "text-foreground")}>
                {RATING_LABELS[val]}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">{val}/5</span>
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="text-sm font-semibold mb-1.5 block flex items-center gap-1.5">
          <MessageSquare size={13} />
          Feedback (optional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience working with this person..."
          className="w-full bg-secondary border border-border rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground"
          maxLength={500}
        />
      </div>

      <Button
        className="w-full"
        disabled={score === null || submitMutation.isPending}
        onClick={() => {
          if (score !== null) {
            submitMutation.mutate({
              jobId: item.jobId,
              score,
              comment: comment || undefined,
            });
          }
        }}
      >
        {submitMutation.isPending ? "Submitting..." : "Submit Rating"}
      </Button>
    </div>
  );
}

function ReceivedRatingCard({ rating }: { rating: any }) {
  const [showReply, setShowReply] = useState(false);
  const [reply, setReply] = useState(rating.employerResponse ?? "");
  const [saved, setSaved] = useState(false);

  const respondMutation = trpc.ratings.respond.useMutation({
    onSuccess: () => {
      setSaved(true);
      toast.success("Response saved!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
            {rating.rater?.profileImage ? (
              <img src={rating.rater.profileImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-muted-foreground">{(rating.rater?.name ?? "U")[0].toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="font-bold text-sm">{rating.rater?.name ?? "User"}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(rating.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={14}
                className={cn(s <= rating.score ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")}
              />
            ))}
          </div>
          <p className={cn("text-xs font-bold mt-0.5", RATING_COLORS[rating.score as number] ?? "text-foreground")}>
            {RATING_LABELS[rating.score as number] ?? rating.score}
          </p>
        </div>
      </div>

      {rating.comment && (
        <p className="text-sm text-muted-foreground italic">"{rating.comment}"</p>
      )}

      {/* Employer response */}
      {rating.employerResponse && !showReply && (
        <div className="bg-secondary rounded-xl p-3">
          <p className="text-xs text-muted-foreground font-medium mb-1">Your response:</p>
          <p className="text-sm">{rating.employerResponse}</p>
        </div>
      )}

      {!rating.employerResponse && !showReply && (
        <button
          onClick={() => setShowReply(true)}
          className="text-xs text-primary hover:underline"
        >
          + Add response
        </button>
      )}

      {showReply && !saved && (
        <div className="space-y-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Respond to this rating..."
            className="w-full bg-secondary border border-border rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground"
            maxLength={500}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              disabled={!reply || respondMutation.isPending}
              onClick={() => respondMutation.mutate({ ratingId: rating.id, response: reply })}
            >
              {respondMutation.isPending ? "Saving..." : "Save Response"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowReply(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="bg-card rounded-2xl h-48 animate-pulse border border-border" />
      ))}
    </div>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 opacity-40">{icon}</div>
      <p className="font-bold mb-1">{title}</p>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
