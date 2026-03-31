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
  const [step, setStep] = useState<"status" | "upload">("status");
  const [legalName, setLegalName] = useState("");
  const [idImage, setIdImage] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const idInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const { t, isSpanish } = useLanguage();

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
  const submitMutation = trpc.verification.submit.useMutation({
    onSuccess: () => {
      toast.success(isSpanish ? "¡Verificación enviada! Revisaremos en 24 horas." : "Verification submitted! We'll review within 24 hours.");
      refetch();
      setStep("status");
    },
    onError: (e) => toast.error(e.message),
  });

  const status = statusData?.verificationStatus ?? "unverified";
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.unverified;
  const StatusIcon = cfg.icon;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, type: "id" | "selfie") {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (type === "id") setIdImage(result);
      else setSelfie(result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!legalName.trim()) { toast.error(isSpanish ? "Ingresa tu nombre legal" : "Enter your legal name"); return; }
    if (!idImage) { toast.error(isSpanish ? "Sube tu foto de ID" : "Upload your ID photo"); return; }
    setUploading(true);
    try {
      await submitMutation.mutateAsync({
        legalName: legalName.trim(),
        idImageBase64: idImage,
        selfieBase64: selfie ?? undefined,
        mimeType: "image/jpeg",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      <SEOHead title="Worker Verification" description="Verify your identity on ShiftChef to unlock shift applications. Upload your government ID to get verified." canonicalPath="/verify" />
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => step === "upload" ? setStep("status") : navigate("/profile")}
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
        {step === "status" && (
          <>
            {/* Status Card */}
            <div className={`rounded-2xl border p-5 ${cfg.bg}`}>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-black/30 flex items-center justify-center`}>
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
                  { icon: Camera, text: "Opcional: foto selfie para aprobación más rápida" },
                  { icon: CheckCircle2, text: "Tu nombre legal tal como aparece en tu ID" },
                ] : [
                  { icon: FileText, text: "Government-issued ID (driver's license, passport, or state ID)" },
                  { icon: Camera, text: "Optional: selfie photo for faster approval" },
                  { icon: CheckCircle2, text: "Your legal name as it appears on your ID" },
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
                onClick={() => setStep("upload")}
                className="w-full h-14 rounded-2xl bg-[#FF6B00] text-white font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                {status === "rejected" ? (isSpanish ? "Reenviar Verificación" : "Resubmit Verification") : (isSpanish ? "Iniciar Verificación" : "Start Verification")}
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {status === "pending" && (
              <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-4 text-center">
                <p className="text-sm text-blue-300">{isSpanish ? "Tu verificación está siendo revisada." : "Your verification is being reviewed."}</p>
                <p className="text-xs text-white/40 mt-1">{isSpanish ? "Tiempo de revisión típico: menos de 24 horas" : "Typical review time: under 24 hours"}</p>
              </div>
            )}
          </>
        )}

        {step === "upload" && (
          <>
            <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-5">
              {/* Legal Name */}
              <div>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-2">
                  {isSpanish ? "Nombre Legal (como en el ID)" : "Legal Name (as on ID)"}
                </label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="First Last"
                  className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#FF6B00]/50"
                />
              </div>

              {/* ID Photo Upload */}
              <div>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-2">
                  {isSpanish ? "Foto de ID" : "ID Photo"} <span className="text-[#FF6B00]">*</span>
                </label>
                <input ref={idInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => handleFileChange(e, "id")} />
                {idImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/10">
                    <img src={idImage} alt="ID" className="w-full h-40 object-cover" />
                    <button
                      onClick={() => setIdImage(null)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center"
                    >
                      <XCircle className="w-4 h-4 text-white" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-emerald-500/80 rounded-full px-2 py-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                      <span className="text-xs text-white font-medium">{isSpanish ? "Subido" : "Uploaded"}</span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => idInputRef.current?.click()}
                    className="w-full h-32 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 active:border-[#FF6B00]/50 transition-colors"
                  >
                    <Upload className="w-6 h-6 text-white/30" />
                    <p className="text-sm text-white/40">{isSpanish ? "Toca para subir foto de ID" : "Tap to upload ID photo"}</p>
                    <p className="text-xs text-white/20">JPG, PNG — max 5MB</p>
                  </button>
                )}
              </div>

              {/* Selfie Upload (optional) */}
              <div>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-2">
                  {isSpanish ? "Foto Selfie" : "Selfie Photo"} <span className="text-white/20">({isSpanish ? "opcional — acelera la revisión" : "optional — speeds up review"})</span>
                </label>
                <input ref={selfieInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => handleFileChange(e, "selfie")} />
                {selfie ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/10">
                    <img src={selfie} alt="Selfie" className="w-full h-32 object-cover" />
                    <button
                      onClick={() => setSelfie(null)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center"
                    >
                      <XCircle className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => selfieInputRef.current?.click()}
                    className="w-full h-24 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 active:border-white/20 transition-colors"
                  >
                    <Camera className="w-5 h-5 text-white/30" />
                    <p className="text-sm text-white/40">{isSpanish ? "Toca para subir selfie" : "Tap to upload selfie"}</p>
                  </button>
                )}
              </div>

              {/* Privacy note */}
              <p className="text-xs text-white/30 text-center">
                {isSpanish ? "Tu ID está cifrado y almacenado de forma segura. Solo se usa para verificación de identidad y nunca se comparte con empleadores." : "Your ID is encrypted and stored securely. It is only used for identity verification and never shared with employers."}
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={uploading || !legalName || !idImage}
              className="w-full h-14 rounded-2xl bg-[#FF6B00] text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-all"
            >
              {uploading ? (
                <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  {isSpanish ? "Enviar para Verificación" : "Submit for Verification"}
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
