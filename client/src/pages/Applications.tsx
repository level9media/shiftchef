import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AppShell from "@/components/AppShell";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  Clock, CheckCircle, XCircle, ChefHat, Briefcase,
  DollarSign, Star, Zap, ArrowRight, CheckCircle2, ChevronRight,
  LogIn, LogOut, MapPin, UserCheck, CalendarDays, CreditCard
} from "lucide-react";
import { WorkerProfileModal } from "@/components/WorkerProfileModal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
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

function getStatusConfig(isSpanish: boolean): Record<string, { label: string; color: string; bg: string }> {
  return {
    pending:   { label: isSpanish ? "Pendiente" : "Pending",   color: "text-yellow-400", bg: "bg-yellow-400/10" },
    accepted:  { label: isSpanish ? "Aceptado" : "Accepted",  color: "text-emerald-400", bg: "bg-emerald-400/10" },
    rejected:  { label: isSpanish ? "Rechazado" : "Rejected",  color: "text-red-400",    bg: "bg-red-400/10" },
    confirmed: { label: isSpanish ? "Confirmado" : "Confirmed", color: "text-blue-400",   bg: "bg-blue-400/10" },
    completed: { label: isSpanish ? "Completado" : "Completed", color: "text-muted-foreground", bg: "bg-secondary" },
  };
}

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
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"worker" | "employer">("worker");
  const { t, isSpanish } = useLanguage();
  const ROLE_LABELS = isSpanish ? ROLE_LABELS_ES : ROLE_LABELS_EN;
  const STATUS_CONFIG = getStatusConfig(isSpanish);

  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const utils = trpc.useUtils();

  const { data: myApps, isLoading: appsLoading } = trpc.applications.myApplications.useQuery(
    undefined, { enabled: isAuthenticated }
  );
  const { data: myJobs, isLoading: jobsLoading } = trpc.jobs.myJobs.useQuery(
    undefined, { enabled: isAuthenticated }
  );

  const acceptMutation = trpc.applications.accept.useMutation({
    onSuccess: () => { toast.success(isSpanish ? "¡Solicitante aceptado!" : "Applicant accepted!"); utils.jobs.myJobs.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const rejectMutation = trpc.applications.reject.useMutation({
    onSuccess: () => { toast.success(isSpanish ? "Solicitante rechazado" : "Applicant rejected"); utils.jobs.myJobs.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const acceptAndPayMutation = trpc.payments.acceptAndPay.useMutation({
    onSuccess: (data) => {
      // Direct navigation — mobile browsers block window.open popups
      window.location.href = data.url;
    },
    onError: (e) => toast.error(e.message),
  });
  // Legacy payForJob kept for backward compat with existing held-payment jobs
  const payMutation = trpc.payments.payForJob.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (e) => toast.error(e.message),
  });
  const completeMutation = trpc.jobs.complete.useMutation({
    onSuccess: () => { toast.success("Shift marked complete!"); utils.jobs.myJobs.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const releaseMutation = trpc.payments.releasePayment.useMutation({
    onSuccess: () => { toast.success("Payment released to worker!"); utils.jobs.myJobs.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const checkInMutation = trpc.shifts.checkIn.useMutation({
    onSuccess: () => { toast.success("Checked in! Have a great shift."); utils.applications.myApplications.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const clockOutMutation = trpc.shifts.clockOut.useMutation({
    onSuccess: (data) => {
      toast.success(`Shift complete! ${data.hoursWorked}h worked · $${data.totalWagesOwed} earned`);
      utils.applications.myApplications.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const { data: pendingRatings } = trpc.ratings.pendingRatings.useQuery(
    undefined, { enabled: isAuthenticated }
  );

  const isWorker = !profile?.userType || profile.userType === "worker" || profile.userType === "both";
  const isEmployer = profile?.userType === "employer" || profile?.userType === "both";

  return (
    <AppShell>
      <SEOHead title="My Shifts & Applications — ShiftChef" description="Manage your shift applications, track accepted jobs, check in and clock out. ShiftChef hospitality staffing." canonicalPath="/applications" />
      <div className="max-w-lg mx-auto">
        {/* ── Pending Ratings Banner ──────────────────────────────────── */}
        {pendingRatings && pendingRatings.length > 0 && (
          <div className="mx-4 mt-3 mb-1">
            <button
              onClick={() => navigate("/ratings")}
              className="w-full flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-2xl p-3.5 hover:bg-primary/15 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Star size={16} className="text-primary fill-primary" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-bold text-foreground">
                  {pendingRatings.length} {isSpanish ? `turno${pendingRatings.length !== 1 ? "s" : ""} esperando tu calificación` : `shift${pendingRatings.length !== 1 ? "s" : ""} waiting for your rating`}
                </p>
                <p className="text-xs text-muted-foreground">{isSpanish ? "Toca para calificar y construir tu reputación" : "Tap to rate and build your reputation"}</p>
              </div>
              <ChevronRight size={14} className="text-primary flex-shrink-0" />
            </button>
          </div>
        )}

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
            {isWorker && (
              <button
                onClick={() => setTab("worker")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all",
                  tab === "worker" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                <ChefHat size={11} strokeWidth={2.5} /> {t("myApplications")}
              </button>
            )}
            {isEmployer && (
              <button
                onClick={() => setTab("employer")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all",
                  tab === "employer" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                <Briefcase size={11} strokeWidth={2.5} /> {t("myShifts")}
              </button>
            )}
          </div>
        </div>

        {/* ── Worker: My Applications ───────────────────────────────────── */}
        {tab === "worker" && (
          <div className="px-4 py-4 space-y-3">
            {appsLoading ? (
              <Skeletons />
            ) : !myApps?.length ? (
              <EmptyState
                icon={<ChefHat size={36} className="text-muted-foreground/30" />}
                title={t("noApplications")}
                desc={isSpanish ? "Explora el feed y aplica a turnos" : "Browse the live feed and apply to shifts"}
                action={{ label: isSpanish ? "Ver Turnos" : "Browse Shifts", onClick: () => navigate("/feed") }}
              />
            ) : (
              myApps.map((app: any) => {
                const status = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
                const job = app.job;
                const hours = job ? ((job.endTime - job.startTime) / 3600000).toFixed(1) : "?";
                const pay = job ? (parseFloat(job.payRate) * parseFloat(hours) * 0.9).toFixed(0) : "?";
                return (
                  <div
                    key={app.id}
                    className="bg-card rounded-2xl border border-border p-4 card-press"
                    onClick={() => job && navigate(`/jobs/${job.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-black text-sm text-foreground">
                          {job ? (ROLE_LABELS[job.role] ?? job.role) : "Shift"}
                        </p>
                        {job?.restaurantName && (
                          <p className="text-xs text-muted-foreground mt-0.5">{job.restaurantName}</p>
                        )}
                      </div>
                      <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-full flex-shrink-0", status.bg, status.color)}>
                        {status.label}
                      </span>
                    </div>

                    {job && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <MetaPill icon={<Clock size={9} />}>
                          {formatDate(job.startTime)} · {formatTime(job.startTime)}–{formatTime(job.endTime)}
                        </MetaPill>
                        <MetaPill icon={<DollarSign size={9} />}>~${pay} earned</MetaPill>
                      </div>
                    )}

                    {app.status === "accepted" && !app.checkInAt && (
                      <div className="mt-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle size={13} className="text-emerald-400 flex-shrink-0" />
                          <p className="text-xs text-emerald-400 font-black">{isSpanish ? "¡Conseguiste el turno!" : "You got the shift!"}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {isSpanish ? "Llega a tiempo y regístra tu entrada al llegar. El pago se retiene de forma segura y se libera después del turno." : "Show up on time and check in when you arrive. Payment is held securely and releases after the shift."}
                        </p>
                      </div>
                    )}

                    {app.status === "accepted" && app.checkInAt && !app.checkOutAt && (
                      <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock size={12} className="text-blue-400" />
                          <p className="text-xs text-blue-400 font-bold">
                            Checked in at {new Date(Number(app.checkInAt)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="w-full rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700"
                          disabled={clockOutMutation.isPending}
                          onClick={(e) => { e.stopPropagation(); clockOutMutation.mutate({ applicationId: app.id }); }}
                        >
                          <LogOut size={11} className="mr-1.5" />
                          {clockOutMutation.isPending ? (isSpanish ? "Registrando salida..." : "Clocking out...") : (isSpanish ? "Registrar Salida" : "Clock Out")}
                        </Button>
                      </div>
                    )}

                    {app.status === "accepted" && !app.checkInAt && (
                      <div className="mt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full rounded-xl text-xs font-bold border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                          disabled={checkInMutation.isPending}
                          onClick={(e) => { e.stopPropagation(); checkInMutation.mutate({ applicationId: app.id }); }}
                        >
                          <LogIn size={11} className="mr-1.5" />
                          {checkInMutation.isPending ? (isSpanish ? "Registrando entrada..." : "Checking in...") : (isSpanish ? "Registrar Entrada" : "Check In")}
                        </Button>
                      </div>
                    )}

                    {app.status === "confirmed" && (
                      <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                        <p className="text-xs text-blue-400 font-bold flex items-center gap-1.5">
                          <CheckCircle size={12} /> {isSpanish ? "Turno confirmado — ¡preséntate y cobra!" : "Shift confirmed — show up and get paid!"}
                        </p>
                      </div>
                    )}

                    <p className="text-[10px] text-muted-foreground mt-2">
                      Applied {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Employer: My Jobs ─────────────────────────────────────────── */}
        {tab === "employer" && (
          <div className="px-4 py-4 space-y-3">
            <button
              onClick={() => navigate("/post-job")}
              className="w-full flex items-center justify-between bg-primary/10 border border-primary/30 rounded-2xl p-4 card-press"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                  <Zap size={15} className="text-primary-foreground" strokeWidth={2.5} />
                </div>
                <span className="font-bold text-sm text-foreground">{isSpanish ? "Publicar Nuevo Turno" : "Post a New Shift"}</span>
              </div>
              <ArrowRight size={15} className="text-primary" />
            </button>

            {jobsLoading ? (
              <Skeletons />
            ) : !myJobs?.length ? (
              <EmptyState
                icon={<Briefcase size={36} className="text-muted-foreground/30" />}
                title={isSpanish ? "Sin turnos publicados aún" : "No shifts posted yet"}
                desc={isSpanish ? "Publica tu primer turno para recibir solicitudes" : "Post your first shift to start receiving applications"}
              />
            ) : (
              myJobs.map((job: any) => (
                <EmployerJobCard
                  key={job.id}
                  job={job}
                  onAccept={(appId) => acceptMutation.mutate({ applicationId: appId })}
                  onAcceptAndPay={(appId) => acceptAndPayMutation.mutate({ applicationId: appId, origin: window.location.origin })}
                  onReject={(appId) => rejectMutation.mutate({ applicationId: appId })}
                  onMarkComplete={(jobId) => completeMutation.mutate({ id: jobId })}
                  onRelease={(jobId) => releaseMutation.mutate({ jobId })}
                  responding={acceptMutation.isPending || rejectMutation.isPending || acceptAndPayMutation.isPending}
                  releasing={releaseMutation.isPending}
                />
              ))
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ── Hire Confirmation Modal ──────────────────────────────────────────────────
function HireConfirmModal({ open, onClose, onConfirm, app, job, loading, isSpanish }: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  app: any;
  job: any;
  loading: boolean;
  isSpanish: boolean;
}) {
  if (!open || !app || !job) return null;
  const ROLE_LABELS = isSpanish ? ROLE_LABELS_ES : ROLE_LABELS_EN;
  const roleLabel = ROLE_LABELS[job.role] ?? job.role;
  const startDate = new Date(job.startTime).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  const arrivalTime = new Date(job.startTime - 10 * 60 * 1000).toLocaleString("en-US", {
    hour: "2-digit", minute: "2-digit",
  });
  const endTime = new Date(job.endTime).toLocaleString("en-US", { hour: "2-digit", minute: "2-digit" });
  const hours = ((job.endTime - job.startTime) / 3600000).toFixed(1);
  const totalPay = (parseFloat(hours) * parseFloat(job.payRate)).toFixed(2);
  const mapsUrl = [job.restaurantName, job.location, job.city].filter(Boolean).join(", ");
  const mapsLink = mapsUrl ? "https://maps.google.com/?q=" + encodeURIComponent(mapsUrl) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-card rounded-t-3xl border-t border-border p-5 pb-8 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <UserCheck size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="font-black text-base text-foreground">
              {isSpanish ? "Confirmar Contratación" : "Confirm Hire"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isSpanish
                ? `${app.worker?.name ?? "Worker"} recibirá los detalles del turno`
                : `${app.worker?.name ?? "Worker"} will receive shift details`}
            </p>
          </div>
        </div>

        {/* Worker info */}
        <div className="flex items-center gap-3 bg-secondary rounded-2xl p-3 mb-4">
          {app.worker?.profileImage ? (
            <img src={app.worker.profileImage} alt="" className="w-10 h-10 rounded-xl object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center">
              <ChefHat size={16} className="text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-foreground">{app.worker?.name ?? "Worker"}</p>
            {app.worker?.rating && (
              <span className="flex items-center gap-0.5 text-[10px] text-yellow-400">
                <Star size={9} strokeWidth={2.5} />
                {parseFloat(app.worker.rating).toFixed(1)} rating
              </span>
            )}
          </div>
        </div>

        {/* What worker will receive */}
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
          {isSpanish ? "El trabajador recibirá:" : "Worker will receive:"}
        </p>
        <div className="space-y-2 mb-5">
          <div className="flex items-start gap-2.5 text-xs text-foreground">
            <CalendarDays size={13} className="text-primary mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold">{isSpanish ? "Turno:" : "Shift:"}</span> {roleLabel} · {startDate}
              <br />
              <span className="text-muted-foreground">
                {isSpanish ? "Llegar a las" : "Arrive by"} {arrivalTime} · {isSpanish ? "Termina" : "Ends"} {endTime} · {hours}h
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-foreground">
            <MapPin size={13} className="text-primary mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold">{isSpanish ? "Ubicación:" : "Location:"}</span> {job.restaurantName ?? ""}{job.location ? " · " + job.location : ""}
              {mapsLink && (
                <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="ml-1 text-primary underline">
                  {isSpanish ? "Ver mapa" : "View map"}
                </a>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-foreground">
            <CreditCard size={13} className="text-primary mt-0.5 flex-shrink-0" />
            <span>
              <span className="font-semibold">{isSpanish ? "Pago:" : "Pay:"}</span> ${job.payRate}/hr · ~${totalPay} {isSpanish ? "total" : "total"}
            </span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
            <CheckCircle size={13} className="text-emerald-400 mt-0.5 flex-shrink-0" />
            <span>{isSpanish ? "Instrucciones de llegada, info de contacto y enlace de Google Maps" : "Arrival instructions, your contact info, and Google Maps link"}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 rounded-2xl" onClick={onClose} disabled={loading}>
            {isSpanish ? "Cancelar" : "Cancel"}
          </Button>
          <Button className="flex-1 rounded-2xl btn-glow" onClick={onConfirm} disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isSpanish ? "Procesando..." : "Processing..."}
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <UserCheck size={14} />
                {isSpanish ? "Contratar y Notificar" : "Hire & Notify Worker"}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmployerJobCard({ job, onAccept, onAcceptAndPay, onReject, onMarkComplete, onRelease, responding, releasing }: {
  job: any;
  onAccept: (id: number) => void;
  onAcceptAndPay: (id: number) => void;
  onReject: (id: number) => void;
  onMarkComplete: (id: number) => void;
  onRelease: (id: number) => void;
  responding: boolean;
  releasing: boolean;
})  {
  const [expanded, setExpanded] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any | null>(null);
  const [hireTarget, setHireTarget] = useState<any | null>(null);
  const { isSpanish } = useLanguage();
  const ROLE_LABELS = isSpanish ? ROLE_LABELS_ES : ROLE_LABELS_EN;
  const STATUS_CONFIG = getStatusConfig(isSpanish);
  const { data: apps, refetch: refetchApps } = trpc.applications.forJob.useQuery({ jobId: job.id }, { enabled: expanded });
  const hours = ((job.endTime - job.startTime) / 3600000).toFixed(1);
  const confirmedApp = apps?.find((a: any) => a.status === "confirmed" || a.status === "completed" || a.status === "accepted");

  const markStartedMutation = trpc.shifts.markStarted.useMutation({
    onSuccess: () => { toast.success("Shift started!"); refetchApps(); },
    onError: (e) => toast.error(e.message),
  });
  const markEndedMutation = trpc.shifts.markEnded.useMutation({
    onSuccess: (data) => {
      toast.success(`Shift ended! ${data.hoursWorked}h worked · $${data.totalWagesOwed} total wages`);
      refetchApps();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 text-left">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-black text-sm text-foreground">
              {ROLE_LABELS[job.role] ?? job.role}
              {job.restaurantName && <span className="text-muted-foreground font-normal"> · {job.restaurantName}</span>}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <MetaPill icon={<Clock size={9} />}>
                {formatDate(job.startTime)} · {hours}h
              </MetaPill>
              <MetaPill icon={<DollarSign size={9} />}>${job.payRate}/hr</MetaPill>
              <span className={cn(
                "text-[10px] font-black px-2 py-0.5 rounded-full",
                job.status === "live" ? "bg-emerald-500/20 text-emerald-400" : "bg-secondary text-muted-foreground"
              )}>
                {job.status}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-3">
            <p className="text-xs font-bold text-foreground">{job.applicationCount ?? 0} applied</p>
            <p className="text-[10px] text-muted-foreground">{expanded ? "▲ hide" : "▼ show"}</p>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border">
          {!apps ? (
            <div className="p-4 flex justify-center">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : apps.length === 0 ? (
            <p className="p-4 text-xs text-muted-foreground text-center">{isSpanish ? "Sin solicitudes aún" : "No applications yet"}</p>
          ) : (
            <div className="divide-y divide-border">
              {apps.map((app: any) => {
                const status = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
                return (
                  <div key={app.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        className="flex items-center gap-2 text-left hover:opacity-75 transition-opacity"
                        onClick={() => setSelectedWorker(app.worker ? { ...app.worker, avatarUrl: app.worker.profileImage } : null)}
                        title="View worker profile"
                      >
                        {app.worker?.profileImage ? (
                          <img src={app.worker.profileImage} alt="" className="w-9 h-9 rounded-xl object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                            <ChefHat size={14} className="text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-foreground underline decoration-dotted underline-offset-2">{app.worker?.name ?? "Worker"}</p>
                          {app.worker?.rating && (
                            <span className="flex items-center gap-0.5 text-[10px] text-yellow-400">
                              <Star size={9} strokeWidth={2.5} />
                              {parseFloat(app.worker.rating).toFixed(1)}
                            </span>
                          )}
                        </div>
                      </button>
                      <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full", status.bg, status.color)}>
                        {status.label}
                      </span>
                    </div>

                    {app.coverNote && (
                      <p className="text-xs text-muted-foreground italic mb-2">"{app.coverNote}"</p>
                    )}

                    <div className="flex gap-2">
                      {app.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="flex-1 rounded-xl text-xs btn-glow"
                            disabled={responding}
                            onClick={() => setHireTarget(app)}
                          >
                            <UserCheck size={11} className="mr-1" />
                            {isSpanish ? "Contratar" : "Hire"}
                          </Button>
                          <Button size="sm" variant="outline" className="flex-shrink-0 rounded-xl text-xs" disabled={responding} onClick={() => onReject(app.id)}>
                            <XCircle size={11} />
                          </Button>
                        </>
                      )}
                      {app.status === "accepted" && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                          <CheckCircle size={12} />
                          {isSpanish ? "Trabajador aceptado — depósito retenido" : "Worker accepted — escrow held"}
                        </div>
                      )}
                      {app.status === "completed" && (
                        <Button size="sm" className="flex-1 rounded-xl text-xs btn-glow" disabled={releasing} onClick={() => onRelease(app.jobId ?? job.id)}>
                          {releasing ? (isSpanish ? "Liberando..." : "Releasing...") : (isSpanish ? "Liberar Pago" : "Release Payment")}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      <WorkerProfileModal
        worker={selectedWorker}
        open={!!selectedWorker}
        onClose={() => setSelectedWorker(null)}
      />
      <HireConfirmModal
        open={!!hireTarget}
        onClose={() => setHireTarget(null)}
        onConfirm={() => {
          if (hireTarget) {
            onAcceptAndPay(hireTarget.id);
            setHireTarget(null);
          }
        }}
        app={hireTarget}
        job={job}
        loading={responding}
        isSpanish={isSpanish}
      />
    </div>
  );
}

function MetaPill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
      {icon}{children}
    </span>
  );
}

function Skeletons() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card rounded-2xl border border-border p-4 space-y-2 animate-pulse">
          <div className="h-4 bg-secondary rounded-lg w-1/2" />
          <div className="h-3 bg-secondary rounded-lg w-1/3" />
          <div className="h-8 bg-secondary rounded-xl mt-2" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, title, desc, action }: {
  icon: React.ReactNode; title: string; desc: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4">{icon}</div>
      <p className="font-bold text-foreground mb-1">{title}</p>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">{desc}</p>
      {action && (
        <Button size="sm" className="rounded-xl" onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}
