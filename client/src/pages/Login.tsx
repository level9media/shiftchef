import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowRight, ArrowLeft, Phone, Shield, Zap, TrendingUp } from "lucide-react";
import { loadFirebase } from "@/lib/firebase";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getApiBase } from "@/lib/platform";

type Step = "phone" | "code" | "name";

export default function Login() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading, refresh } = useAuth();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const recaptchaRef = useRef<any>(null);

  const updateProfile = trpc.profile.update.useMutation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/onboarding");
    }
  }, [isAuthenticated, loading]);

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const getE164 = (val: string) => `+1${val.replace(/\D/g, "")}`;

  const handleSendCode = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) { setError("Please enter a valid 10-digit phone number"); return; }
    setError("");
    setSending(true);
    try {
      const { auth, RecaptchaVerifier, signInWithPhoneNumber } = await loadFirebase();
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => {},
        });
      }
      const result = await signInWithPhoneNumber(auth, getE164(phone), recaptchaRef.current);
      setConfirmationResult(result);
      setStep("code");
    } catch (err: any) {
      console.error("[Login] Send error:", err);
      setError("Failed to send code. Please try again.");
      recaptchaRef.current = null;
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) { setError("Please enter the 6-digit code"); return; }
    setError("");
    setVerifying(true);
    try {
      const result = await confirmationResult.confirm(code);
      const idToken = await result.user.getIdToken();
      setFirebaseUser(result.user);

      const base = getApiBase();
      const res = await fetch(`${base}/api/auth/firebase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken, phone: getE164(phone) }),
      });

      if (!res.ok) throw new Error("Auth failed");
      const data = await res.json();

      if (!data.user?.name) {
        setStep("name");
      } else {
        await refresh();
        navigate(data.user?.profileComplete ? "/feed" : "/onboarding");
      }
    } catch (err: any) {
      console.error("[Login] Verify error:", err);
      setError("Incorrect code. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleSaveName = async () => {
    if (name.trim().length < 2) { setError("Please enter your name"); return; }
    setError("");
    setSaving(true);
    try {
      await updateProfile.mutateAsync({ name: name.trim() });
      await refresh();
      navigate("/onboarding");
    } catch (err) {
      console.error("[Login] Save name error:", err);
      navigate("/onboarding");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ paddingTop: "var(--sat)" }}>
      <div id="recaptcha-container" />

      {/* Header */}
      <div className="flex items-center px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center">
            <span className="text-white font-black text-sm">SC</span>
          </div>
          <span className="text-xl font-black tracking-tight text-foreground">
            Shift<span className="text-primary">Chef</span>
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-6 pt-6 pb-10 max-w-sm mx-auto w-full">

        {/* ── Phone step ─────────────────────────────────────────────── */}
        {step === "phone" && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-black text-foreground mb-2 leading-tight">
                Find shifts.<br /><span className="text-primary">Get paid daily.</span>
              </h1>
              <p className="text-muted-foreground text-sm">
                Enter your phone number to get started. No passwords needed.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Phone number
                </label>
                <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5 focus-within:border-primary/50 transition-colors">
                  <Phone size={16} className="text-muted-foreground flex-shrink-0" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="(512) 555-0100"
                    className="flex-1 bg-transparent text-foreground text-base outline-none placeholder:text-muted-foreground"
                    maxLength={14}
                    onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  By continuing you agree to our Terms & Privacy Policy.
                </p>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                onClick={handleSendCode}
                disabled={sending || phone.replace(/\D/g, "").length !== 10}
                className="w-full h-14 bg-primary text-primary-foreground font-black text-base rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
              >
                {sending
                  ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <>Continue <ArrowRight size={18} /></>}
              </button>
            </div>

            <div className="mt-8 space-y-2.5">
              {[
                { icon: <Zap size={14} className="text-primary" />, text: "Live shifts from local restaurants" },
                { icon: <Shield size={14} className="text-emerald-400" />, text: "Background verified workers only" },
                { icon: <TrendingUp size={14} className="text-blue-400" />, text: "90% payout — we only take 10%" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 bg-card rounded-2xl p-3 border border-border">
                  <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    {f.icon}
                  </div>
                  <p className="text-xs text-foreground font-medium">{f.text}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Code step ──────────────────────────────────────────────── */}
        {step === "code" && (
          <>
            <button onClick={() => { setStep("phone"); setCode(""); setError(""); }} className="flex items-center gap-2 text-muted-foreground mb-8 text-sm">
              <ArrowLeft size={16} /> Back
            </button>

            <div className="mb-8">
              <h1 className="text-2xl font-black text-foreground mb-2">Check your texts</h1>
              <p className="text-muted-foreground text-sm">
                We sent a 6-digit code to <span className="text-foreground font-bold">{phone}</span>
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="number"
                value={code}
                onChange={(e) => setCode(e.target.value.slice(0, 6))}
                placeholder="000000"
                className="w-full bg-card border border-border rounded-2xl px-4 py-4 text-foreground text-2xl font-black tracking-[0.5em] outline-none text-center focus:border-primary/50 transition-colors"
                onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
                autoFocus
              />

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                onClick={handleVerifyCode}
                disabled={verifying || code.length !== 6}
                className="w-full h-14 bg-primary text-primary-foreground font-black text-base rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {verifying
                  ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <>Verify <ArrowRight size={18} /></>}
              </button>

              <button
                onClick={() => { setStep("phone"); setCode(""); setError(""); recaptchaRef.current = null; }}
                className="w-full text-center text-sm text-muted-foreground py-2"
              >
                Didn't get a code? Go back
              </button>
            </div>
          </>
        )}

        {/* ── Name step ──────────────────────────────────────────────── */}
        {step === "name" && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-black text-foreground mb-2">What's your name?</h1>
              <p className="text-muted-foreground text-sm">
                This is how employers and workers will see you on ShiftChef.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Full name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-card border border-border rounded-2xl px-4 py-4 text-foreground text-base outline-none focus:border-primary/50 transition-colors"
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  autoFocus
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                onClick={handleSaveName}
                disabled={saving || name.trim().length < 2}
                className="w-full h-14 bg-primary text-primary-foreground font-black text-base rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving
                  ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <>Get Started <ArrowRight size={18} /></>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
