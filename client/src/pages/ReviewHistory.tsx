import { SEOHead } from "@/components/SEOHead";
import { trpc } from "@/lib/trpc";
import AppShell from "@/components/AppShell";
import { useParams, useLocation } from "wouter";
import { Star, ChefHat, ArrowLeft, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const RATING_LABELS: Record<number, string> = {
  5: "Absolutely", 4: "Sure", 3: "Maybe", 2: "Not really", 1: "Never",
};
const RATING_COLORS: Record<number, string> = {
  5: "text-emerald-400", 4: "text-green-400", 3: "text-yellow-400",
  2: "text-orange-400", 1: "text-red-400",
};

export default function ReviewHistory() {
  const params = useParams<{ userId: string }>();
  const userId = parseInt(params.userId ?? "0", 10);
  const [, navigate] = useLocation();

  const { data: reviews, isLoading } = trpc.ratings.forUser.useQuery(
    { userId },
    { enabled: !!userId && !isNaN(userId) }
  );
  const { data: stats } = trpc.ratings.stats.useQuery(
    { userId },
    { enabled: !!userId && !isNaN(userId) }
  );

  const displayName = (reviews?.[0] as any)?.recipientName ?? "User";

  return (
    <AppShell>
      <SEOHead
        title={`${displayName} Reviews - ShiftChef`}
        description={`Read verified shift reviews for ${displayName} on ShiftChef.`}
        canonicalPath={`/reviews/${userId}`}
      />
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1 as any)}
            className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0"
          >
            <ArrowLeft size={16} className="text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-black text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Reviews
            </h1>
            {displayName && reviews && reviews.length > 0 && (
              <p className="text-xs text-muted-foreground">for {displayName}</p>
            )}
          </div>
        </div>

        {/* Stats hero */}
        {stats && stats.total > 0 && (
          <div className="mx-4 mb-4 bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black text-foreground">{stats.avg.toFixed(1)}</span>
                  <span className="text-primary text-2xl font-black mb-1">/ 5</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on {stats.total} verified shift{stats.total !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      className={i < Math.round(stats.avg) ? "text-primary fill-primary" : "text-muted-foreground"}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">avg rating</p>
              </div>
            </div>
            {/* Score breakdown */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((s) => {
                const count = (stats.breakdown as Record<number, number>)[s] ?? 0;
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={s} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-4 text-right">{s}</span>
                    <Star size={10} className="text-primary fill-primary flex-shrink-0" />
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-5 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reviews list */}
        <div className="px-4 pb-24 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-5 animate-pulse">
                  <div className="flex gap-3 mb-3">
                    <div className="w-10 h-10 bg-secondary rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-secondary rounded-lg w-1/3" />
                      <div className="h-3 bg-secondary rounded-lg w-1/4" />
                    </div>
                  </div>
                  <div className="h-12 bg-secondary rounded-xl" />
                </div>
              ))}
            </div>
          ) : !reviews || reviews.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <MessageSquare size={36} className="text-muted-foreground/30 mb-3" />
              <p className="font-bold text-foreground">No reviews yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Reviews appear after completing verified shifts on ShiftChef.
              </p>
            </div>
          ) : (
            reviews.map((rating: any) => (
              <ReviewCard key={rating.id} rating={rating} />
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}

function ReviewCard({ rating }: { rating: any }) {
  const color = RATING_COLORS[rating.score as number] ?? "text-muted-foreground";
  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
            {rating.raterImage ? (
              <img src={rating.raterImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <ChefHat size={14} className="text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">{rating.raterName ?? "Verified User"}</p>
            <p className="text-[10px] text-muted-foreground capitalize">
              {rating.raterType} · {new Date(rating.createdAt).toLocaleDateString([], {
                month: "short", day: "numeric", year: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
          <p className={cn("text-2xl font-black", color)}>{rating.score}/5</p>
          <p className={cn("text-[10px] font-bold", color)}>{RATING_LABELS[rating.score as number]}</p>
        </div>
      </div>

      {rating.comment && (
        <p className="text-sm text-muted-foreground italic border-t border-border pt-3">
          "{rating.comment}"
        </p>
      )}

      {rating.response && (
        <div className="bg-secondary rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground font-bold mb-1 uppercase tracking-wider">Response</p>
          <p className="text-xs text-foreground">{rating.response}</p>
        </div>
      )}

      {/* Verified badge */}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Star size={9} className="text-primary fill-primary" />
        <span>Verified shift on ShiftChef</span>
      </div>
    </div>
  );
}
