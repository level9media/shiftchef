import { useState, useRef } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  ShieldCheck, ShieldAlert, ShieldX, Upload, Camera,
  CheckCircle2, Clock, XCircle, ArrowLeft, ChevronRight, FileText
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function WorkerVerification() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [legalName, setLegalName] = useState("");
  const [idImage, setIdImage] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const { isSpanish } = useLanguage();

  const STATUS_CONFIG = {
    unverified: {
      icon: ShieldAlert,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10 border-yellow-400/20",
      label: isSpanish ? "No Verificado" : "Not Verified",
      desc: isSpanish ? "Verifica tu identidad para desbloquear todos los trabajos y generar confianza con los empleadores." : "Verify your identity to unlock all jobs and build employer trust.",
    },
    pending: {
      icon: Clock,
      color: "text-blue-400",
      bg: "bg-blue-400/10 border-blue-400/20",
      label: isSpanish ? "En Revisión" : "Under Review",
      desc: isSpanish ? "Tu ID está siendo revisado. Esto generalmente toma menos de 24 horas." : "Your ID is being reviewed. This usually takes under 24 hours.",
    },
    verified: {
      icon: ShieldCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10 border-emerald-400/20",
      label: isSpanish ? "Verificado ✓" : "Verified ✓",
      desc: isSpanish ? "Tu identidad está confirmada. Apareces como verificado para todos los empleadores." : "Your identity is confirmed. You appear as verified to all employers.",
    },
    rejected: {
      icon: ShieldX,
      color: "text-red-400",
      bg: "bg-red-400/10 border-red-400/20",
      label: isSpanish ? "Rechazado" : "Rejected",
      desc: isSpanish ? "Tu verificación fue rechazada. Por favor reenvía con una foto de ID más clara." : "Your verification was rejected. Please resubmit with a clearer ID photo.",
    },
  };

  const { data: statusData, refetch } = trpc.verification.myStatus.useQuery();

  const stripeSessionMutation = trpc.verification.createStripeSession.useMutation({
    onSuccess: ({ url }) => {
      if (url) window.location.href = url;
    },
    onError: (e) => toast.error(e.message),
  });

  const status = statusData?.verificationStatus ?? "unverified";
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.unverified;
  const StatusIcon = cfg.icon;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      <SEOHead title="Worker Verification" description="Verify your identity on ShiftChef to unlock shift applications. Upload your government ID to get verified." canonicalPath="/verify" />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/profile")}
            className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center active:scale-95">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white font-display">{isSpanish ? "Verificación de Identidad" : "Identity Verification"}</h1>
            <p className="text-xs text-white/40">{isSpanish ? "Requerido para aplicar a trabajos" : "Required to apply for jobs"}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-4">
        {/* Status Card */}
        <div className={`rounded-2xl border p-5 ${cfg.bg}`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-black/30 flex items-center justify-center">
              <StatusIcon className={`w-7 h-7 ${cfg.color}`} />
            </div>
            <div className="flex-1">
              <p className={`text-lg font-bold font-display ${cfg.color}`}>{cfg.label}</p>
              <p className="text-sm text-white/60 mt-0.5">{cfg.desc}</p>
            </div>
          </div>
          {status === "rejected" && statusData?.verificationNote && (
            <div className="mt-4 p-3 rounded-xl bg-black/30 border border-red-400/20">
              <p className="text-xs text-red-300 font-medium">Admin note:</p>
              <p className="text-sm text-white/70 mt-1">{statusData.verificationNote}</p>
            </div>
          )}
          {status === "verified" && statusData?.verifiedAt && (
            <div className="mt-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <p className="text-xs text-white/50">
                Verified on {new Date(statusData.verifiedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          )}
        </div>

        {/* Why Verify */}
        {status !== "verified" && (
          <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white/80">{isSpanish ? "¿Por qué verificarse?" : "Why get verified?"}</h3>
            {(isSpanish ? [
              "Los empleadores filtran primero por trabajadores verificados",
              "La insignia verificado aparece en tu perfil y tarjeta del feed",
              "Accede a trabajos mejor pagados con requisitos de calificación mínima",
              "Genera confianza — los trabajadores verificados se contratan 3x más rápido",
            ] : [
              "Employers filter by verified workers first",
              "Verified badge appears on your profile and feed card",
              "Access higher-paying jobs with minimum rating requirements",
              "Builds trust — verified workers get hired 3x faster",
            ]).map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#FF6B00] mt-0.5 shrink-0" />
                <p className="text-sm text-white/60">{item}</p>
              </div>
            ))}
          </div>
        )}

        {/* What You'll Need */}
        {(status === "unverified" || status === "rejected") && (
          <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white/80">{isSpanish ? "Lo que necesitarás" : "What you'll need"}</h3>
            {(isSpanish ? [
              { icon: FileText, text: "ID emitido por el gobierno (licencia de conducir, pasaporte o ID estatal)" },
              { icon: Camera, text: "Foto selfie — Stripe la usará para comparar con tu ID" },
              { icon: CheckCircle2, text: "El proceso es seguro y tarda menos de 2 minutos" },
            ] : [
              { icon: FileText, text: "Government-issued ID (driver's license, passport, or state ID)" },
              { icon: Camera, text: "Selfie photo — Stripe will use it to match your ID" },
              { icon: CheckCircle2, text: "The process is secure and takes under 2 minutes" },
            ]).map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <Icon className="w-4 h-4 text-white/30 mt-0.5 shrink-0" />
                <p className="text-sm text-white/60">{text}</p>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        {(status === "unverified" || status === "rejected") && (
          <button
            onClick={() => stripeSessionMutation.mutate()}
            disabled={stripeSessionMutation.isPending}
            className="w-full h-14 rounded-2xl bg-[#FF6B00] text-white font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-40"
          >
            {stripeSessionMutation.isPending ? (
              <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <>
                {status === "rejected" ? (isSpanish ? "Reenviar Verificación" : "Resubmit Verification") : (isSpanish ? "Iniciar Verificación" : "Start Verification")}
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        )}

        {status === "pending" && (
          <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-4 text-center">
            <p className="text-sm text-blue-300">{isSpanish ? "Tu verificación está siendo revisada." : "Your verification is being reviewed."}</p>
            <p className="text-xs text-white/40 mt-1">{isSpanish ? "Tiempo de revisión típico: menos de 24 horas" : "Typical review time: under 24 hours"}</p>
          </div>
        )}
      </div>
    </div>
  );
}