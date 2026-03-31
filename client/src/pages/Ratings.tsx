import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLocation } from "wouter";
import { Star, MessageSquare, CheckCircle, ChefHat, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

const RATING_LABELS_EN: Record<number, string> = {
  5: "Absolutely",
  4: "Sure",
  3: "Maybe",
  2: "Not really",
  1: "Never",
};
const RATING_LABELS_ES: Record<number, string> = {
  5: "Absolutamente",
  4: "Claro",
  3: "Tal vez",
  2: "No realmente",
  1: "Nunca",
};

const RATING_COLORS: Record<number, string> = {
  5: "text-emerald-400",
  4: "text-green-400",
  3: "text-yellow-400",
  2: "text-orange-400",
  1: "text-red-400",
};

const ROLE_LABELS_EN: Record<string, string> = {
  cook: "Cook", sous_chef: "Sous Chef", prep: "Prep Cook",
  dishwasher: "Dishwasher", cleaner: "Cleaner", server: "Server",
  bartender: "Bartender", host: "Host", manager: "Manager",
};
const ROLE_LABELS_ES: Record<string, string> = {
  cook: "Cocinero", sous_chef: "Sous Chef", prep: "Cocinero de Preparación",
  dishwasher: "Lavaplatos", cleaner: "Limpiador", server: "Mesero",
  bartender: "Bartender", host: "Anfitrión", manager: "Gerente",
};

export default function Ratings() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"pending" | "received" | "given">("pending");
  const { isSpanish } = useLanguage();
  const ROLE_LABELS = isSpanish ? ROLE_LABELS_ES : ROLE_LABELS_EN;
  const RATING_LABELS = isSpanish ? RATING_LABELS_ES : RATING_LABELS_EN;

  const { data: pending, isLoading: pendingLoading } = trpc.ratings.pendingRatings.useQuery();
  const { data: received, isLoading: receivedLoading } = trpc.ratings.forUser.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user?.id }
  );
  const { data: given, isLoading: givenLoading } = trpc.ratings.given.useQuery();
  const { data: stats } = trpc.ratings.stats.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user?.id }
  );

  const pendingCount = pending?.length ?? 0;
  const receivedCount = received?.length ?? 0;
  const givenCount = given?.length ?? 0;

  return (
    <AppShell>
      <SEOHead title="Ratings and Reviews - ShiftChef" canonicalPath="/ratings" />
      <div className="max-w-lg mx-auto">
        <div className="px-4 pt-4 pb-3">
          <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {isSpanish ? "Calificaciones" : "Ratings"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{isSpanish ? "Tu historial de comentarios de turnos" : "Your shift feedback history"}</p>
        </div>

        {stats && stats.total > 0 && (
          <div className="mx-4 mb-4 bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black text-foreground">{stats.avg.toFixed(1)}</span>
                  <span className="text-primary text-xl font-black mb-1">/ 5</span>
                </div>
                <p className="text-xs text-muted-foreground">{stats.total} {isSpanish ? `calificación${stats.total !== 1 ? "es" : ""} recibida${stats.total !== 1 ? "s" : ""}` : `rating${stats.total !== 1 ? "s" : ""} received`}</p>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className={i < Math.round(stats.avg) ? "text-primary fill-primary" : "text-muted-foreground"} />
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((s) => {
                const count = (stats.breakdown as Record<number, number>)[s] ?? 0;
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground w-4 text-right">{s}</span>
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-4">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-1 px-4 mb-4">
          {(["pending", "received", "given"] as const).map((t) => {
            const count = t === "pending" ? pendingCount : t === "received" ? receivedCount : givenCount;
            const tabLabel = isSpanish
              ? t === "pending" ? "Pendiente" : t === "received" ? "Recibidas" : "Dadas"
              : t === "pending" ? "Pending" : t === "received" ? "Received" : "Given";
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-bold transition-all capitalize",
                  tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {tabLabel}
                {count > 0 && (
                  <span className={cn("ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-black", tab === t ? "bg-white/20" : "bg-card")}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="px-4 pb-24 space-y-3">
          {tab === "pending" && (
            pendingLoading ? <Skeletons /> :
            pendingCount === 0 ? (
              <EmptyState icon={<CheckCircle size={32} className="text-emerald-400" />} title={isSpanish ? "¡Todo al día!" : "All caught up!"} desc={isSpanish ? "Sin calificaciones pendientes. Completa un turno para desbloquear calificaciones." : "No pending ratings. Complete a shift and release payment to unlock ratings."} />
            ) : (
              pending!.map((item: any) => (
                <PendingRatingCard key={item.job.id} item={item} onRate={(jobId) => navigate(`/rate/${jobId}`)} />
              ))
            )
          )}
          {tab === "received" && (
            receivedLoading ? <Skeletons /> :
            receivedCount === 0 ? (
              <EmptyState icon={<Star size={32} className="text-muted-foreground" />} title={isSpanish ? "Sin calificaciones aún" : "No ratings yet"} desc={isSpanish ? "Completa turnos y recibe calificaciones de empleadores y trabajadores." : "Complete shifts and get rated by employers and workers."} />
            ) : (
              received!.map((rating: any) => (
                <ReceivedRatingCard key={rating.id} rating={rating} />
              ))
            )
          )}
          {tab === "given" && (
            givenLoading ? <Skeletons /> :
            givenCount === 0 ? (
              <EmptyState icon={<MessageSquare size={32} className="text-muted-foreground" />} title={isSpanish ? "Sin calificaciones dadas aún" : "No ratings given yet"} desc={isSpanish ? "Después de completar un turno, califica a la otra parte para construir confianza." : "After completing a shift, rate the other party to build platform trust."} />
            ) : (
              given!.map((rating: any) => (
                <GivenRatingCard key={rating.id} rating={rating} />
              ))
            )
          )}
        </div>
      </div>
    </AppShell>
  );
}

function PendingRatingCard({ item, onRate }: { item: any; onRate: (jobId: number) => void }) {
  const { job, otherUser } = item;
  const { isSpanish } = useLanguage();
  const ROLE_LABELS = isSpanish ? ROLE_LABELS_ES : ROLE_LABELS_EN;
  const formatDate = (ms: number) => new Date(ms).toLocaleDateString([], { month: "short", day: "numeric" });
  return (
    <div className="bg-card rounded-2xl border border-primary/30 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-sm text-foreground">
            {ROLE_LABELS[job.role] ?? job.role}{job.restaurantName ? ` at ${job.restaurantName}` : ""}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(job.startTime)}</p>
        </div>
        <span className="text-[10px] font-bold text-primary bg-primary/15 px-2 py-1 rounded-full">{isSpanish ? "Calificar" : "Rate Now"}</span>
      </div>
      {otherUser && (
        <div className="flex items-center gap-2.5 bg-secondary/60 rounded-xl p-2.5">
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
            {otherUser.profileImage ? (
              <img src={otherUser.profileImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <ChefHat size={14} className="text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{otherUser.name}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{otherUser.userType ?? "user"}</p>
          </div>
        </div>
      )}
      <Button className="w-full h-11 rounded-xl btn-glow font-bold" onClick={() => onRate(job.id)}>
        {isSpanish ? "Dejar Calificación" : "Leave Rating"} <ArrowRight size={14} className="ml-2" />
      </Button>
    </div>
  );
}

function ReceivedRatingCard({ rating }: { rating: any }) {
  const [showReply, setShowReply] = useState(false);
  const [reply, setReply] = useState(rating.response ?? "");
  const [saved, setSaved] = useState(false);
  const utils = trpc.useUtils();
  const { isSpanish } = useLanguage();
  const RATING_LABELS = isSpanish ? RATING_LABELS_ES : RATING_LABELS_EN;
  const respondMutation = trpc.ratings.respond.useMutation({
    onSuccess: () => { setSaved(true); toast.success("Response saved!"); utils.ratings.forUser.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const color = RATING_COLORS[rating.score as number] ?? "text-muted-foreground";
  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
            {rating.raterImage ? <img src={rating.raterImage} alt="" className="w-full h-full object-cover" /> : <ChefHat size={14} className="text-muted-foreground" />}
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">{rating.raterName ?? "User"}</p>
            <p className="text-[10px] text-muted-foreground capitalize">
              {rating.raterType} · {new Date(rating.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
          <p className={cn("text-2xl font-black", color)}>{rating.score}/5</p>
          <p className={cn("text-[10px] font-bold", color)}>{RATING_LABELS[rating.score as number]}</p>
        </div>
      </div>
      {rating.comment && <p className="text-sm text-muted-foreground italic border-t border-border pt-2">"{rating.comment}"</p>}
      {(rating.response || saved) && !showReply && (
        <div className="bg-secondary rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground font-bold mb-1">YOUR RESPONSE</p>
          <p className="text-sm text-foreground">{rating.response || reply}</p>
        </div>
      )}
      {!rating.response && !showReply && !saved && (
        <button onClick={() => setShowReply(true)} className="text-xs text-primary font-bold hover:underline">Add response</button>
      )}
      {showReply && !saved && (
        <div className="space-y-2">
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Respond to this rating..."
            className="w-full bg-secondary border border-border rounded-xl p-3 text-sm resize-none h-16 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground" maxLength={500} />
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

function GivenRatingCard({ rating }: { rating: any }) {
  const color = RATING_COLORS[rating.score as number] ?? "text-muted-foreground";
  const { isSpanish } = useLanguage();
  const ROLE_LABELS = isSpanish ? ROLE_LABELS_ES : ROLE_LABELS_EN;
  const RATING_LABELS = isSpanish ? RATING_LABELS_ES : RATING_LABELS_EN;
  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
            {rating.recipientImage ? <img src={rating.recipientImage} alt="" className="w-full h-full object-cover" /> : <ChefHat size={14} className="text-muted-foreground" />}
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">{rating.recipientName ?? "User"}</p>
            <p className="text-[10px] text-muted-foreground">
              {rating.jobRole ? (ROLE_LABELS[rating.jobRole] ?? rating.jobRole) : ""}{rating.jobRestaurant ? ` at ${rating.jobRestaurant}` : ""}
            </p>
            <p className="text-[10px] text-muted-foreground">{new Date(rating.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
          <p className={cn("text-2xl font-black", color)}>{rating.score}/5</p>
          <p className={cn("text-[10px] font-bold", color)}>{RATING_LABELS[rating.score as number]}</p>
        </div>
      </div>
      {rating.comment && <p className="text-sm text-muted-foreground italic border-t border-border pt-2">"{rating.comment}"</p>}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <CheckCircle size={10} className="text-emerald-400" />
        <span>Rating submitted</span>
      </div>
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
