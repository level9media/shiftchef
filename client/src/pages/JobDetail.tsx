import { SEOHead, buildJobPostingSchema } from "@/components/SEOHead";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import AppShell from "@/components/AppShell";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Clock, MapPin, Star, TrendingUp, Flag,
  DollarSign, CheckCircle, AlertCircle, Zap, ChevronRight, ShieldCheck, ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

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
const ROLE_EMOJI: Record<string, string> = {
  cook: "👨‍🍳", sous_chef: "🍴", prep: "🥗", dishwasher: "🫧",
  cleaner: "🧹", server: "🍽️", bartender: "🍸", host: "🤝", manager: "📋",
};

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatDate(ms: number, isSpanish: boolean) {
  const d = new Date(ms);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return isSpanish ? "Hoy" : "Today";
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return isSpanish ? "Mañana" : "Tomorrow";
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
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
  const { t, isSpanish } = useLanguage();
  const ROLE_LABELS = isSpanish ? ROLE_LABELS_ES : ROLE_LABELS_EN;

  const { data: job, isLoading } = trpc.jobs.get.useQuery({ id: parseInt(id ?? "0") });
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const utils = trpc.useUtils();

  const { data: verificationStatus } = trpc.verification.myStatus.useQuery(undefined, { enabled: isAuthenticated, retry: false });

  const applyMutation = trpc.applications.applyToJob.useMutation({
    onSuccess: () => {
      setApplied(true);
      toast.success(isSpanish ? "¡Solicitud enviada! 🎉" : "Application sent! 🎉");
      utils.applications.myApplications.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (!job) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <AlertCircle size={40} className="text-muted-foreground mb-3" />
          <p className="font-bold text-foreground">{isSpanish ? "Turno no encontrado" : "Shift not found"}</p>
          <p className="text-sm text-muted-foreground mt-1">{isSpanish ? "Puede haber expirado o sido eliminado." : "It may have expired or been removed."}</p>
          <button onClick={() => navigate("/feed")} className="mt-4 text-primary text-sm font-bold">← {isSpanish ? "Volver al Feed" : "Back to Feed"}</button>
        </div>
      </AppShell>
    );
  }

  const hours = calcHours(job.startTime, job.endTime);
  const totalPay = job.totalPay ? parseFloat(job.totalPay) : parseFloat(job.payRate) * parseFloat(hours);
  const workerRating = profile?.rating ? parseFloat(String(profile.rating)) : 5;
  const minRating = job.minRating ? parseFloat(String(job.minRating)) : 0;
  const belowMin = isAuthenticated && minRating > 0 && workerRating < minRating;
  const isWorker = !profile?.userType || profile.userType === "worker" || profile.userType === "both";
  const isOwnJob = profile?.id === job.employerId;
  const isExpired = job.status !== "live";
  const isVerified = verificationStatus?.verificationStatus === "verified";
  const isPendingVerification = verificationStatus?.verificationStatus === "pending";
  const needsVerification = isAuthenticated && isWorker && !isVerified;

  return (
    <AppShell>
      {job && (
        <SEOHead
          title={`${(job.role || "").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}${job.restaurantName ? ` at ${job.restaurantName}` : ""} — ShiftChef`}
          description={job.description || `${(job.role || "").replace(/_/g, " ")} shift available in ${job.city || "Austin"}. $${job.payRate}/hr. Apply now on ShiftChef.`}
          canonicalPath={`/jobs/${job.id}`}
          ogType="article"
          jsonLd={buildJobPostingSchema(job)}
        />
      )}
      <div className="max-w-lg mx-auto">
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div className="relative">
          <div className="relative h-56 bg-secondary flex items-center justify-center overflow-hidden">
            {job.restaurantImage ? (
              <img src={job.restaurantImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-7xl">{ROLE_EMOJI[job.role] ?? "🍽️"}</span>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
            {isExpired && (
              <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                <span className="bg-destructive text-destructive-foreground font-black px-5 py-2 rounded-2xl text-sm uppercase tracking-widest">
                  {job.status}
                </span>
              </div>
            )}
          </div>

          {/* Back */}
          <button
            onClick={() => navigate("/feed")}
            className="absolute top-4 left-4 w-10 h-10 rounded-2xl bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border"
          >
            <ArrowLeft size={18} className="text-foreground" />
          </button>

          {/* Type badge */}
          <div className="absolute top-4 right-4">
            {job.isPermanent ? (
              <span className="flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full">
                <TrendingUp size={9} strokeWidth={3} /> {isSpanish ? "Perm. Potencial" : "Perm Potential"}
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full">
                <Flag size={9} strokeWidth={3} /> {isSpanish ? "Temporal" : "Temp"}
              </span>
            )}
          </div>
        </div>

        {/* ── Content ───────────────────────────────────────────────────── */}
        <div className="px-4 -mt-4 relative z-10 space-y-3 pb-36">
          {/* Title */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-black text-foreground">{ROLE_LABELS[job.role] ?? job.role}</h1>
                {job.restaurantName && <p className="text-sm text-muted-foreground mt-0.5">{job.restaurantName}</p>}
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <p className="text-3xl font-black text-primary">${job.payRate}</p>
                <p className="text-xs text-muted-foreground">/hr</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("shiftDetails")}</p>
            <DetailRow icon={<Clock size={14} className="text-primary" />} label={isSpanish ? "Fecha y Hora" : "Date & Time"}>
              {formatDate(job.startTime, isSpanish)} · {formatTime(job.startTime)}–{formatTime(job.endTime)} ({hours}h)
            </DetailRow>
            {job.city && (
              <DetailRow icon={<MapPin size={14} className="text-primary" />} label={t("location")}>
                {job.city}
              </DetailRow>
            )}
            {minRating > 0 && (
              <DetailRow icon={<Star size={14} className="text-yellow-400" />} label={t("minRating")}>
                <span className={cn(belowMin ? "text-destructive" : "text-foreground")}>
                  {minRating}★ {isSpanish ? "requerido" : "required"} {isAuthenticated && `(${isSpanish ? "tuyo" : "yours"}: ${workerRating.toFixed(1)}★)`}
                </span>
              </DetailRow>
            )}
          </div>

          {/* Pay breakdown */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{t("payBreakdown")}</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isSpanish ? "Bruto" : "Gross"} ({hours}h × ${job.payRate}/hr)</span>
                <span className="font-bold text-foreground">${totalPay.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isSpanish ? "Comisión plataforma (10%)" : "Platform fee (10%)"}</span>
                <span className="text-muted-foreground">-${(totalPay * 0.1).toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between items-center">
                <span className="font-bold text-foreground">{isSpanish ? "Tú ganas" : "You earn"}</span>
                <span className="text-2xl font-black text-emerald-400">${(totalPay * 0.9).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {job.description && (
            <div className="bg-card rounded-2xl border border-border p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{isSpanish ? "Sobre Este Turno" : "About This Shift"}</p>
              <p className="text-sm text-foreground leading-relaxed">{job.description}</p>
            </div>
          )}

          {/* Verification banners */}
          {isWorker && !isOwnJob && !isExpired && needsVerification && !isPendingVerification && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 flex items-start gap-3">
              <ShieldAlert size={16} className="text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-orange-400 mb-1">{isSpanish ? "Verificación de ID Requerida" : "ID Verification Required"}</p>
                <p className="text-xs text-muted-foreground mb-2">{t("verifyRequired")}</p>
                <button onClick={() => navigate("/verify")} className="text-xs font-bold text-orange-400 hover:underline">{t("verifyNow")} →</button>
              </div>
            </div>
          )}
          {isWorker && !isOwnJob && !isExpired && isPendingVerification && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex items-start gap-3">
              <ShieldCheck size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-400">{t("verificationPending")}</p>
            </div>
          )}
          {/* Rating warning */}
          {belowMin && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle size={16} className="text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">
                {isSpanish
                  ? `Tu calificación (${workerRating.toFixed(1)}★) está por debajo del mínimo de ${minRating}★ para este turno.`
                  : `Your rating (${workerRating.toFixed(1)}★) is below the ${minRating}★ minimum for this shift.`}
              </p>
            </div>
          )}

          {/* Employer: view applicants */}
          {isOwnJob && (
            <button
              onClick={() => navigate("/applications")}
              className="w-full flex items-center justify-between bg-primary/10 border border-primary/30 rounded-2xl p-4 card-press"
            >
              <span className="font-bold text-sm text-foreground">{isSpanish ? "Ver Solicitantes" : "View Applicants"}</span>
              <ChevronRight size={16} className="text-primary" />
            </button>
          )}

          {/* Worker: apply */}
          {isWorker && !isOwnJob && !isExpired && (
            <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{isSpanish ? "Tu Solicitud" : "Your Application"}</p>
              {!applied && !belowMin && (
                <textarea
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder={isSpanish ? "Agrega una nota (opcional) — preséntate, tu experiencia..." : "Add a note (optional) — introduce yourself, your experience..."}
                  className="w-full bg-secondary border border-border rounded-xl p-3 text-sm resize-none h-24 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                  maxLength={500}
                />
              )}
              {applied && (
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <CheckCircle size={16} strokeWidth={2.5} />
                  {isSpanish ? "¡Solicitud enviada! El empleador revisará pronto." : "Application sent! Employer will review soon."}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Sticky CTA ────────────────────────────────────────────────── */}
        {isWorker && !isOwnJob && !isExpired && (
          <div
            className="fixed left-0 right-0 z-50 px-4 py-2 border-t border-border"
            style={{
              bottom: "calc(64px + var(--sab, 0px))",
              background: "oklch(0.06 0 0 / 0.97)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="max-w-lg mx-auto">
              {!isAuthenticated ? (
                <Button size="sm" className="w-full h-10 text-sm font-bold rounded-xl btn-glow" onClick={() => navigate("/")}>
                  {t("signInToApply")}
                </Button>
              ) : applied ? (
                <Button size="sm" className="w-full h-10 text-sm font-bold rounded-xl" disabled>
                  <CheckCircle size={15} className="mr-1.5" /> {t("applied")}
                </Button>
              ) : needsVerification && !isPendingVerification ? (
                <Button size="sm" className="w-full h-10 text-sm font-bold rounded-xl bg-orange-500 hover:bg-orange-600 text-white" onClick={() => navigate("/verify")}>
                  <ShieldAlert size={15} className="mr-1.5" /> {t("verifyToApply")}
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="w-full h-10 text-sm font-bold rounded-xl btn-glow"
                  disabled={belowMin || applyMutation.isPending}
                  onClick={() => applyMutation.mutate({ jobId: job.id, coverNote: coverNote || undefined })}
                >
                  {applyMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : belowMin ? (
                    t("ratingTooLow")
                  ) : (
                    <>{isVerified && <ShieldCheck size={14} className="mr-1" />}{isSpanish ? `Aplicar · Ganar $${(totalPay * 0.9).toFixed(0)}` : `Apply · Earn $${(totalPay * 0.9).toFixed(0)}`}</>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">{icon}</div>
      <div className="flex-1 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground flex-shrink-0">{label}</span>
        <span className="text-sm font-semibold text-foreground text-right">{children}</span>
      </div>
    </div>
  );
}
