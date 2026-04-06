import { useLocation } from "wouter";
import { CheckCircle2, LayoutDashboard, Plus } from "lucide-react";

export default function JobPosted() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
      </div>
      <h1 className="text-3xl font-black text-white mb-3">
        Your Shift is Live! 🎉
      </h1>
      <p className="text-white/60 text-sm leading-relaxed max-w-xs mb-10">
        Workers in Austin can now see and apply to your shift. Most shifts receive applications within the hour.
      </p>
      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={() => setLocation("/employer-dashboard")}
          className="w-full h-14 rounded-2xl bg-[#FF6B00] text-white font-bold text-base flex items-center justify-center gap-2"
        >
          <LayoutDashboard className="w-5 h-5" />
          View Dashboard & Applicants
        </button>
        <button
          onClick={() => setLocation("/post-job")}
          className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-white/70 font-semibold text-sm flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Post Another Shift
        </button>
      </div>
    </div>
  );
}