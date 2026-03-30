import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { FileText, CheckCircle2, ArrowLeft, PenLine, ShieldCheck, AlertTriangle } from "lucide-react";

const CONTRACT_DATE = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

export default function ContractAgreement() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [legalName, setLegalName] = useState(user?.name ?? "");
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);

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

  async function handleSign() {
    if (!agreed) { toast.error("Check the agreement box to continue"); return; }
    if (!legalName.trim()) { toast.error("Enter your legal name"); return; }
    setSigning(true);
    try {
      await signMutation.mutateAsync({ agreedToTerms: true, legalName: legalName.trim() });
    } finally {
      setSigning(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/profile")}
            className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center active:scale-95">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white font-display">Contractor Agreement</h1>
            <p className="text-xs text-white/40">1099 Independent Contractor — Required to get paid</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-4">
        {alreadySigned ? (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-6 text-center space-y-3">
            <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
            <p className="text-lg font-bold text-white font-display">Agreement Signed</p>
            <p className="text-sm text-white/60">
              You signed the ShiftChef Independent Contractor Agreement on{" "}
              {contractStatus?.contractSignedAt
                ? new Date(contractStatus.contractSignedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                : CONTRACT_DATE}.
            </p>
            <p className="text-xs text-white/30">
              Your signature is legally binding. A copy has been recorded with your account.
            </p>
          </div>
        ) : (
          <>
            {/* Warning Banner */}
            <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/20 p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-300">Required before your first payout</p>
                <p className="text-xs text-white/50 mt-1">You must sign this agreement to receive payment for completed shifts. This classifies you as a 1099 independent contractor.</p>
              </div>
            </div>

            {/* Contract Document */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/5 overflow-hidden">
              <div className="bg-white/5 px-5 py-4 flex items-center gap-3 border-b border-white/5">
                <FileText className="w-5 h-5 text-[#FF6B00]" />
                <div>
                  <p className="text-sm font-bold text-white">ShiftChef Independent Contractor Agreement</p>
                  <p className="text-xs text-white/40">Effective: {CONTRACT_DATE}</p>
                </div>
              </div>

              <div className="px-5 py-4 max-h-[55vh] overflow-y-auto space-y-4 text-sm text-white/60 leading-relaxed">
                <p className="text-white/80 font-semibold">INDEPENDENT CONTRACTOR AGREEMENT</p>

                <p>This Independent Contractor Agreement ("Agreement") is entered into as of the date of electronic signature below, between <strong className="text-white">ShiftChef, LLC</strong>, a Texas limited liability company ("Company"), and the individual signing below ("Contractor").</p>

                <div className="space-y-1">
                  <p className="text-white/80 font-semibold">1. INDEPENDENT CONTRACTOR STATUS</p>
                  <p>Contractor is an independent contractor and not an employee, partner, agent, or joint venturer of Company. Contractor shall have no authority to bind Company in any contract or agreement. Company shall not control the manner or means by which Contractor performs services, only the result.</p>
                </div>

                <div className="space-y-1">
                  <p className="text-white/80 font-semibold">2. SERVICES</p>
                  <p>Contractor agrees to provide food service and hospitality labor services ("Services") to employers who post shifts on the ShiftChef platform. Contractor retains the right to accept or decline any shift posted on the platform.</p>
                </div>

                <div className="space-y-1">
                  <p className="text-white/80 font-semibold">3. COMPENSATION</p>
                  <p>Contractor shall receive ninety percent (90%) of the shift payment collected by Company from the employer, after deduction of the Company's ten percent (10%) platform fee. Payments are released within 2–5 business days following shift completion and employer confirmation.</p>
                </div>

                <div className="space-y-1">
                  <p className="text-white/80 font-semibold">4. TAX OBLIGATIONS</p>
                  <p>Contractor is solely responsible for all federal, state, and local taxes on compensation received, including self-employment tax. Company will issue IRS Form 1099-NEC for any Contractor earning $600 or more in a calendar year. Contractor agrees to provide accurate tax identification information upon request.</p>
                </div>

                <div className="space-y-1">
                  <p className="text-white/80 font-semibold">5. NO BENEFITS</p>
                  <p>Contractor is not entitled to any employee benefits, including but not limited to health insurance, workers' compensation, unemployment insurance, paid time off, or retirement benefits from Company.</p>
                </div>

                <div className="space-y-1">
                  <p className="text-white/80 font-semibold">6. PLATFORM RULES</p>
                  <p>Contractor agrees to (a) maintain accurate profile information including skills and ratings; (b) honor accepted shift commitments; (c) maintain professional conduct at all employer locations; (d) not circumvent the platform to arrange direct payments with employers for shifts originated through ShiftChef for a period of 12 months following introduction.</p>
                </div>

                <div className="space-y-1">
                  <p className="text-white/80 font-semibold">7. RATINGS AND REVIEWS</p>
                  <p>Contractor acknowledges that employers may rate and review their performance after each completed shift. Ratings are public and affect Contractor's ability to apply for future shifts. Company reserves the right to suspend accounts with sustained ratings below 2.0.</p>
                </div>

                <div className="space-y-1">
                  <p className="text-white/80 font-semibold">8. LIABILITY LIMITATION</p>
                  <p>Company acts solely as a marketplace connecting contractors with employers. Company is not liable for any injury, loss, or damage arising from Contractor's performance of services. Contractor agrees to indemnify and hold harmless Company from any claims arising from Contractor's acts or omissions.</p>
                </div>

                <div className="space-y-1">
                  <p className="text-white/80 font-semibold">9. GOVERNING LAW</p>
                  <p>This Agreement shall be governed by the laws of the State of Texas. Any disputes shall be resolved in Travis County, Texas.</p>
                </div>

                <div className="space-y-1">
                  <p className="text-white/80 font-semibold">10. ENTIRE AGREEMENT</p>
                  <p>This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements. This Agreement may be modified only by written consent of both parties.</p>
                </div>

                <p className="text-white/40 text-xs">By signing below, Contractor acknowledges they have read, understood, and agree to all terms of this Agreement. Electronic signature has the same legal effect as a handwritten signature under the Electronic Signatures in Global and National Commerce Act (E-SIGN).</p>
              </div>
            </div>

            {/* Signature Section */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <PenLine className="w-4 h-4 text-[#FF6B00]" />
                <p className="text-sm font-semibold text-white">Electronic Signature</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-2">
                  Your Legal Name
                </label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="First Last (as on government ID)"
                  className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#FF6B00]/50"
                />
              </div>

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
                  I have read and agree to the ShiftChef Independent Contractor Agreement. I understand I am an independent contractor (1099) and am responsible for my own taxes.
                </p>
              </label>

              <p className="text-xs text-white/30">
                Signing date: {CONTRACT_DATE} · Your IP address will be recorded as proof of signature.
              </p>
            </div>

            <button
              onClick={handleSign}
              disabled={signing || !agreed || !legalName.trim()}
              className="w-full h-14 rounded-2xl bg-[#FF6B00] text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-all"
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
          </>
        )}
      </div>
    </div>
  );
}
