import { useState, useRef, useEffect, useCallback } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  FileText, CheckCircle2, ArrowLeft, PenLine,
  ShieldCheck, AlertTriangle, ScrollText, Lock,
  Eraser, RotateCcw
} from "lucide-react";

const CONTRACT_DATE = new Date().toLocaleDateString("en-US", {
  month: "long", day: "numeric", year: "numeric"
});

const CONTRACT_VERSION = "1.2";

const SECTIONS = [
  {
    title: "1. INDEPENDENT CONTRACTOR STATUS",
    body: `Contractor is an independent contractor and not an employee, partner, agent, or joint venturer of ShiftChef, LLC ("Company"). Company shall not control the manner or means by which Contractor performs services, only the result. Contractor has no authority to bind Company in any contract or agreement, and shall not represent themselves as a Company employee to any third party.`
  },
  {
    title: "2. SERVICES",
    body: `Contractor agrees to provide food service and hospitality labor ("Services") to employers who post shifts on the ShiftChef platform. Contractor retains the right to accept or decline any shift. Company does not guarantee any minimum number of shifts or earnings.`
  },
  {
    title: "3. COMPENSATION & PLATFORM FEE",
    body: `Contractor shall receive ninety percent (90%) of the gross shift payment collected by Company from the employer. Company retains a ten percent (10%) platform fee. Payments are processed via Stripe Connect and released within 2–5 business days following shift completion and employer confirmation. Contractor must maintain an active, verified Stripe Express account to receive payments.`
  },
  {
    title: "4. TAX OBLIGATIONS (1099)",
    body: `Contractor is solely responsible for all federal, state, and local taxes on compensation received, including self-employment tax. Company will issue IRS Form 1099-NEC for any Contractor earning $600 or more in a calendar year. Contractor agrees to provide accurate tax identification information (SSN or EIN) upon request and acknowledges that no withholding will be made by Company.`
  },
  {
    title: "5. NO EMPLOYEE BENEFITS",
    body: `Contractor is not entitled to any employee benefits, including but not limited to: health insurance, workers' compensation, unemployment insurance, paid time off, sick leave, retirement benefits, or any other benefit provided to Company employees.`
  },
  {
    title: "6. PLATFORM RULES & CONDUCT",
    body: `Contractor agrees to: (a) maintain accurate profile information including skills, certifications, and ratings; (b) honor all accepted shift commitments — no-shows may result in account suspension; (c) maintain professional conduct at all employer locations; (d) not circumvent the platform to arrange direct payments with employers for shifts originated through ShiftChef for a period of 12 months following introduction; (e) comply with all applicable food safety laws and maintain required certifications.`
  },
  {
    title: "7. RATINGS, REVIEWS & ACCOUNT STANDING",
    body: `Contractor acknowledges that employers may rate and review performance after each completed shift. Ratings are visible to all employers on the platform. Company reserves the right to suspend or terminate accounts with sustained ratings below 2.0 or with repeated no-shows. Ratings cannot be removed except in cases of verified fraud.`
  },
  {
    title: "8. INTELLECTUAL PROPERTY",
    body: `Any work product created by Contractor in the course of performing Services shall be the property of the hiring employer unless otherwise agreed in writing. Contractor grants ShiftChef a non-exclusive, royalty-free license to use their name, likeness, ratings, and profile for platform operations and marketing. Contractor shall not use ShiftChef's trademarks or brand assets without prior written consent.`
  },
  {
    title: "9. CONFIDENTIALITY",
    body: `Contractor agrees to keep confidential any proprietary information or trade secrets belonging to ShiftChef or its Clients disclosed during the course of performing Services. This obligation survives termination of this Agreement.`
  },
  {
    title: "10. LIMITATION OF LIABILITY & INDEMNIFICATION",
    body: `Company acts solely as a marketplace connecting contractors with employers. Company is not liable for any injury, loss, or damage arising from Contractor's performance of services. TO THE MAXIMUM EXTENT PERMITTED BY LAW, COMPANY'S TOTAL LIABILITY SHALL NOT EXCEED THE TOTAL FEES PAID TO CONTRACTOR IN THE 30 DAYS PRECEDING THE CLAIM. Contractor agrees to indemnify, defend, and hold harmless Company from any claims arising from Contractor's acts, omissions, or breach of this Agreement.`
  },
  {
    title: "11. DISPUTE RESOLUTION & ARBITRATION",
    body: `Any dispute arising out of or relating to this Agreement shall be resolved by binding arbitration administered by the American Arbitration Association (AAA) in Austin, Texas. CONTRACTOR WAIVES THE RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS-WIDE ARBITRATION. Either party may seek injunctive relief in a court of competent jurisdiction to prevent irreparable harm.`
  },
  {
    title: "12. TERM & TERMINATION",
    body: `This Agreement is effective upon electronic signature and continues until terminated. Either party may terminate at any time with or without cause. Termination does not affect obligations from shifts already accepted or in progress. Company may suspend or terminate Contractor's account for violation of this Agreement, the Platform's Terms of Service, or applicable law.`
  },
  {
    title: "13. GOVERNING LAW",
    body: `This Agreement shall be governed by the laws of the State of Texas, without regard to conflict of law principles. Any disputes not subject to arbitration shall be resolved in Travis County, Texas.`
  },
  {
    title: "14. ELECTRONIC SIGNATURE",
    body: `Contractor agrees that their typed name, drawn signature, and the timestamp recorded upon submission constitute a valid electronic signature with the same legal effect as a handwritten signature under the Electronic Signatures in Global and National Commerce Act (E-SIGN Act) and the Uniform Electronic Transactions Act (UETA). Contractor's IP address, device information, and timestamp will be recorded as proof of signature.`
  },
  {
    title: "15. ENTIRE AGREEMENT",
    body: `This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements. ShiftChef reserves the right to update this Agreement. Continued use of the platform after notice of changes constitutes acceptance of the updated terms.`
  },
];

// ─── Canvas Signature Pad ─────────────────────────────────────────────────────
function SignaturePad({
  onSign,
  onClear,
  hasSignature,
}: {
  onSign: (dataUrl: string) => void;
  onClear: () => void;
  hasSignature: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    isDrawing.current = true;
    lastPos.current = getPos(e, canvas);
  }, []);

  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e, canvas);
    if (lastPos.current) {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = "#FF6B00";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }
    lastPos.current = pos;
    // Notify parent of signature
    onSign(canvas.toDataURL("image/png"));
  }, [onSign]);

  const endDraw = useCallback(() => {
    isDrawing.current = false;
    lastPos.current = null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", endDraw);
    canvas.addEventListener("mouseleave", endDraw);
    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", endDraw);
    return () => {
      canvas.removeEventListener("mousedown", startDraw);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", endDraw);
      canvas.removeEventListener("mouseleave", endDraw);
      canvas.removeEventListener("touchstart", startDraw);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", endDraw);
    };
  }, [startDraw, draw, endDraw]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
          Draw Your Signature <span className="text-[#FF6B00]">*</span>
        </p>
        {hasSignature && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            <Eraser className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>
      <div className="relative rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <canvas
          ref={canvasRef}
          width={600}
          height={120}
          className="w-full touch-none cursor-crosshair"
          style={{ height: "100px" }}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-xs text-white/20 italic">Sign here with your finger or mouse</p>
          </div>
        )}
        {/* Signature line */}
        <div className="absolute bottom-5 left-6 right-6 border-b border-white/10 pointer-events-none" />
      </div>
      {hasSignature && (
        <p className="text-xs text-emerald-400 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Signature captured
        </p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ContractAgreement() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [legalName, setLegalName] = useState(user?.name ?? "");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const { data: contractStatus } = trpc.contract.status.useQuery();
  const signMutation = trpc.contract.sign.useMutation({
    onSuccess: () => {
      setSigned(true);
      toast.success("Agreement signed. You're ready to work on ShiftChef.");
      setTimeout(() => navigate("/profile"), 2000);
    },
    onError: (e) => toast.error(e.message),
  });

  const alreadySigned = contractStatus?.contractSigned || signed;

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 60) {
      setHasScrolled(true);
    }
  };

  async function handleSign() {
    if (!hasScrolled) { toast.error("Please scroll through the full agreement first"); return; }
    if (!agreed) { toast.error("Check the agreement box to continue"); return; }
    if (!legalName.trim() || legalName.trim().length < 3) { toast.error("Enter your full legal name"); return; }
    if (!signatureDataUrl) { toast.error("Please draw your signature above"); return; }
    setSigning(true);
    try {
      await signMutation.mutateAsync({
        agreedToTerms: true,
        legalName: legalName.trim(),
      });
    } finally {
      setSigning(false);
    }
  }

  const canSign = hasScrolled && agreed && legalName.trim().length >= 3 && !!signatureDataUrl;

  return (
    <>
      <SEOHead title="Contractor Agreement" description="Review and sign the ShiftChef 1099 independent contractor agreement to start working hospitality shifts." canonicalPath="/contract" />
      <div className="min-h-screen bg-[#0A0A0A] pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/profile")}
            className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white font-display">Contractor Agreement</h1>
            <p className="text-xs text-white/40">1099 Independent Contractor · E-SIGN Act · v{CONTRACT_VERSION}</p>
          </div>
          <Lock className="w-4 h-4 text-white/20" />
        </div>
      </div>

      <div className="px-4 pt-6 space-y-4">
        {/* Already signed */}
        {alreadySigned ? (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-6 text-center space-y-3">
            <ShieldCheck className="w-14 h-14 text-emerald-400 mx-auto" />
            <p className="text-xl font-black text-white font-display">Agreement Signed</p>
            <p className="text-sm text-white/60">
              You signed the ShiftChef Independent Contractor Agreement on{" "}
              <span className="text-white font-semibold">
                {contractStatus?.contractSignedAt
                  ? new Date(contractStatus.contractSignedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                  : CONTRACT_DATE}
              </span>.
            </p>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-left space-y-1">
              <p className="text-xs text-white/30 font-semibold uppercase tracking-wider">Signature Record</p>
              <p className="text-xs text-white/50">Contract Version: <span className="text-white/70">v{CONTRACT_VERSION}</span></p>
              <p className="text-xs text-white/50">Method: <span className="text-white/70">Electronic (E-SIGN Act / UETA)</span></p>
              <p className="text-xs text-white/50">Platform: <span className="text-white/70">ShiftChef.co</span></p>
            </div>
            <p className="text-xs text-white/30">
              Your electronic signature is legally binding under the E-SIGN Act. A timestamped record has been saved to your account.
            </p>
            <button
              onClick={() => navigate("/profile")}
              className="mt-2 w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Profile
            </button>
          </div>
        ) : (
          <>
            {/* Warning Banner */}
            <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/20 p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-yellow-300">Required before your first payout</p>
                <p className="text-xs text-white/50 mt-1">
                  Read the full agreement below, then type your legal name and draw your signature to sign. This classifies you as a 1099 independent contractor.
                </p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-2">
              {[
                { label: "Read", done: hasScrolled },
                { label: "Agree", done: agreed },
                { label: "Sign", done: !!legalName.trim() && !!signatureDataUrl },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step.done ? "bg-[#FF6B00] text-white" : "bg-white/10 text-white/30"}`}>
                    {step.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className={`text-xs font-semibold transition-colors ${step.done ? "text-white/70" : "text-white/20"}`}>{step.label}</span>
                  {i < 2 && <div className={`flex-1 h-px transition-colors ${step.done ? "bg-[#FF6B00]/40" : "bg-white/10"}`} />}
                </div>
              ))}
            </div>

            {/* Contract Document */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/5 overflow-hidden">
              {/* Doc header */}
              <div className="bg-white/5 px-5 py-4 flex items-center gap-3 border-b border-white/5">
                <FileText className="w-5 h-5 text-[#FF6B00] shrink-0" />
                <div>
                  <p className="text-sm font-bold text-white">ShiftChef Independent Contractor Agreement</p>
                  <p className="text-xs text-white/40">Effective: {CONTRACT_DATE} · Austin, Texas · v{CONTRACT_VERSION}</p>
                </div>
              </div>

              {/* Scrollable contract body */}
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="px-5 py-4 overflow-y-auto space-y-5 text-sm text-white/60 leading-relaxed"
                style={{ maxHeight: "52vh" }}
              >
                <p className="text-white/80 font-semibold text-base">
                  SHIFTCHEF, LLC — INDEPENDENT CONTRACTOR AGREEMENT
                </p>
                <p className="text-white/50">
                  This Independent Contractor Agreement ("Agreement") is entered into as of {CONTRACT_DATE}, by and between ShiftChef, LLC, a Texas limited liability company ("Company"), and the individual identified below ("Contractor"). By electronically signing this Agreement, Contractor agrees to be bound by all terms and conditions herein.
                </p>

                {SECTIONS.map((s, i) => (
                  <div key={i} className="space-y-1.5">
                    <p className="text-white/90 font-bold text-xs uppercase tracking-wider">{s.title}</p>
                    <p>{s.body}</p>
                  </div>
                ))}

                <div className="pt-4 border-t border-white/10 space-y-2">
                  <p className="text-white/80 font-bold text-sm">ACKNOWLEDGMENT</p>
                  <p className="text-white/50 text-xs">
                    BY SIGNING BELOW, CONTRACTOR ACKNOWLEDGES THAT THEY HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY ALL TERMS AND CONDITIONS OF THIS AGREEMENT. CONTRACTOR CONFIRMS THEY ARE AT LEAST 18 YEARS OF AGE AND LEGALLY AUTHORIZED TO WORK IN THE UNITED STATES.
                  </p>
                </div>

                {/* Bottom spacer so user can scroll to bottom */}
                <div className="h-4" />
              </div>

              {/* Scroll progress indicator */}
              <div className="px-5 py-3 border-t border-white/5 flex items-center gap-2">
                {hasScrolled ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-semibold">Full agreement read ✓</span>
                  </>
                ) : (
                  <>
                    <ScrollText className="w-4 h-4 text-white/30" />
                    <span className="text-xs text-white/40">Scroll to the bottom to unlock signing</span>
                  </>
                )}
              </div>
            </div>

            {/* Signature Section */}
            <div className={`rounded-2xl border p-5 space-y-5 transition-opacity duration-300 ${hasScrolled ? "bg-white/[0.03] border-white/5 opacity-100" : "bg-white/[0.02] border-white/5 opacity-40 pointer-events-none"}`}>
              <div className="flex items-center gap-2">
                <PenLine className="w-4 h-4 text-[#FF6B00]" />
                <p className="text-sm font-bold text-white">Electronic Signature</p>
              </div>

              {/* Typed name */}
              <div>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-2">
                  Full Legal Name <span className="text-[#FF6B00]">*</span>
                </label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="First Last (as on government ID)"
                  className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#FF6B00]/50"
                />
                {legalName.trim().length > 2 && (
                  <p className="text-xs text-white/30 mt-1.5 ml-1 italic">
                    Signing as: "{legalName.trim()}"
                  </p>
                )}
              </div>

              {/* Canvas signature pad */}
              <SignaturePad
                onSign={(dataUrl) => setSignatureDataUrl(dataUrl)}
                onClear={() => setSignatureDataUrl(null)}
                hasSignature={!!signatureDataUrl}
              />

              {/* Signature preview */}
              {signatureDataUrl && legalName.trim().length >= 3 && (
                <div className="rounded-xl bg-white/5 border border-[#FF6B00]/20 p-4 space-y-2">
                  <p className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider">Signature Preview</p>
                  <div className="bg-white/[0.03] rounded-lg p-3 flex flex-col items-start gap-1">
                    <img src={signatureDataUrl} alt="Your signature" className="h-12 object-contain" style={{ filter: "invert(0)" }} />
                    <p className="text-xs text-white/50 italic border-t border-white/10 pt-1 w-full">{legalName.trim()}</p>
                    <p className="text-[10px] text-white/25">{CONTRACT_DATE} · ShiftChef.co · v{CONTRACT_VERSION}</p>
                  </div>
                </div>
              )}

              {/* Agreement checkbox */}
              <label className="flex items-start gap-3 cursor-pointer">
                <div
                  onClick={() => setAgreed(!agreed)}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                    agreed ? "bg-[#FF6B00] border-[#FF6B00]" : "border-white/20 bg-white/5"
                  }`}
                >
                  {agreed && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <p className="text-sm text-white/60 leading-relaxed">
                  I have read and agree to the ShiftChef Independent Contractor Agreement in full. I understand I am a 1099 independent contractor responsible for my own taxes, insurance, and compliance.
                </p>
              </label>

              {/* Signature metadata */}
              <div className="rounded-xl bg-white/3 border border-white/5 p-3 space-y-1">
                <p className="text-xs text-white/30 font-semibold uppercase tracking-wider">Signature Record</p>
                <p className="text-xs text-white/40">Date: <span className="text-white/60">{CONTRACT_DATE}</span></p>
                <p className="text-xs text-white/40">Contract Version: <span className="text-white/60">v{CONTRACT_VERSION}</span></p>
                <p className="text-xs text-white/40">Platform: <span className="text-white/60">ShiftChef.co</span></p>
                <p className="text-xs text-white/40">Method: <span className="text-white/60">Electronic (E-SIGN Act / UETA)</span></p>
                <p className="text-xs text-white/30 mt-1">Your IP address and device fingerprint will be recorded as proof of signature.</p>
              </div>
            </div>

            {/* Sign Button */}
            <button
              onClick={handleSign}
              disabled={signing || !canSign}
              className="w-full h-14 rounded-2xl bg-[#FF6B00] text-white font-black text-base flex items-center justify-center gap-2 disabled:opacity-30 active:scale-[0.98] transition-all shadow-lg shadow-[#FF6B00]/20"
            >
              {signing ? (
                <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <>
                  <PenLine className="w-5 h-5" />
                  Sign Agreement
                </>
              )}
            </button>

            {!hasScrolled && (
              <p className="text-center text-xs text-white/25">
                Scroll through the full agreement above to unlock signing
              </p>
            )}

            <p className="text-center text-xs text-white/20 pb-4">
              Protected under E-SIGN Act &amp; UETA · ShiftChef LLC · Austin, TX
            </p>
          </>
        )}
      </div>
    </div>
    </>
  );
}
