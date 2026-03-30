import { SEOHead } from "@/components/SEOHead";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  ClipboardList, Users, CheckCircle, DollarSign,
  Search, FileText, Star, Banknote,
  ArrowRight, ChefHat, Building2, Zap, Shield
} from "lucide-react";

const EMPLOYER_STEPS = [
  {
    step: "01",
    icon: <ClipboardList size={22} className="text-white" />,
    color: "#FF6B00",
    title: "Post Your Shift",
    desc: "Enter the role, date, time, pay rate, and location. Your shift goes live on the ShiftChef feed in under 60 seconds. Workers in your city see it instantly.",
  },
  {
    step: "02",
    icon: <Users size={22} className="text-white" />,
    color: "#FF6B00",
    title: "Review Applicants",
    desc: "Qualified workers apply with their profile, experience, and star rating. Swipe right to hire, swipe left to pass. You stay in full control of who walks through your door.",
  },
  {
    step: "03",
    icon: <CheckCircle size={22} className="text-white" />,
    color: "#FF6B00",
    title: "Confirm & Communicate",
    desc: "Hired workers get an instant notification with your address, contact info, and arrival instructions. No back-and-forth texts — everything is handled in-app.",
  },
  {
    step: "04",
    icon: <DollarSign size={22} className="text-white" />,
    color: "#FF6B00",
    title: "Track the Shift & Pay",
    desc: "Start the shift with one tap. Clock out when it's done. Hours and wages calculate automatically. Release payment through Stripe — funds hit the worker's account the same day.",
  },
];

const WORKER_STEPS = [
  {
    step: "01",
    icon: <Search size={22} className="text-white" />,
    color: "#10B981",
    title: "Browse Open Shifts",
    desc: "Filter by city, role, pay rate, and date. Every listing shows the total payout upfront — no surprises. Austin, Phoenix, and Mesa shifts available now.",
  },
  {
    step: "02",
    icon: <FileText size={22} className="text-white" />,
    color: "#10B981",
    title: "Apply in Seconds",
    desc: "Tap Apply, add an optional note, and submit. Your profile, rating, and experience are sent to the employer automatically. No resume uploads, no forms.",
  },
  {
    step: "03",
    icon: <CheckCircle size={22} className="text-white" />,
    color: "#10B981",
    title: "Get Hired & Show Up",
    desc: "Accepted? You get an instant push notification with the address, contact person, and arrival instructions. Arrive 10 minutes early, be professional, and you're set.",
  },
  {
    step: "04",
    icon: <Banknote size={22} className="text-white" />,
    color: "#10B981",
    title: "Get Paid Same Day",
    desc: "Clock out when the shift ends. The employer releases payment through Stripe escrow. Transfer directly to your bank account or Apple Pay — same day, every time.",
  },
];

const TRUST_POINTS = [
  { icon: <Shield size={16} className="text-primary" />, text: "Stripe escrow — funds held securely until shift is complete" },
  { icon: <Star size={16} className="text-primary" />, text: "Bidirectional ratings keep quality high on both sides" },
  { icon: <Zap size={16} className="text-primary" />, text: "ID verification for workers — employers know who's showing up" },
  { icon: <CheckCircle size={16} className="text-primary" />, text: "1099 contractor agreement signed before first shift" },
];

export default function HowItWorks() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  return (
    <AppShell>
      <SEOHead
        title="How It Works — ShiftChef | On-Demand Hospitality Staffing"
        description="Post a shift in 60 seconds. Hire verified hospitality workers. Pay same day. ShiftChef connects Austin, Phoenix, and Mesa restaurants with on-demand staff."
        canonicalPath="/how-it-works"
      />

      <div className="max-w-lg mx-auto px-4 pb-32 pt-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-4">
            <ChefHat size={12} className="text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">How ShiftChef Works</span>
          </div>
          <h1 className="text-3xl font-black text-foreground mb-2">
            From post to paid<br />in one shift.
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            ShiftChef connects hospitality businesses with vetted, on-demand workers. No agencies. No markups. Just fast, reliable staffing.
          </p>
        </div>

        {/* Employer Flow */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Building2 size={14} className="text-white" />
            </div>
            <p className="font-black text-foreground text-base">For Employers</p>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-10 bottom-10 w-px bg-border" />

            <div className="space-y-6">
              {EMPLOYER_STEPS.map((s) => (
                <div key={s.step} className="flex gap-4">
                  <div className="flex-shrink-0 relative z-10">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                      style={{ background: s.color }}
                    >
                      {s.icon}
                    </div>
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-muted-foreground tracking-widest">{s.step}</span>
                      <p className="font-bold text-foreground text-sm">{s.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            className="w-full h-11 font-bold rounded-xl text-sm mt-5 btn-glow"
            onClick={() => isAuthenticated ? navigate("/post-job") : window.location.href = getLoginUrl()}
          >
            Post a Shift Now
            <ArrowRight size={14} className="ml-1.5" />
          </Button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center gap-3 mb-10">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">For Workers</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Worker Flow */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
              <ChefHat size={14} className="text-white" />
            </div>
            <p className="font-black text-foreground text-base">For Workers</p>
          </div>

          <div className="relative">
            <div className="absolute left-5 top-10 bottom-10 w-px bg-border" />

            <div className="space-y-6">
              {WORKER_STEPS.map((s) => (
                <div key={s.step} className="flex gap-4">
                  <div className="flex-shrink-0 relative z-10">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                      style={{ background: s.color }}
                    >
                      {s.icon}
                    </div>
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-muted-foreground tracking-widest">{s.step}</span>
                      <p className="font-bold text-foreground text-sm">{s.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            className="w-full h-11 font-bold rounded-xl text-sm mt-5 bg-emerald-500 hover:bg-emerald-600 text-white border-0"
            onClick={() => isAuthenticated ? navigate("/feed") : window.location.href = getLoginUrl()}
          >
            Browse Open Shifts
            <ArrowRight size={14} className="ml-1.5" />
          </Button>
        </div>

        {/* Trust section */}
        <div className="rounded-2xl border border-border bg-card p-5 mb-6">
          <p className="font-black text-foreground text-sm mb-4">Built on trust. Backed by tech.</p>
          <ul className="space-y-3">
            {TRUST_POINTS.map((p, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                <span className="flex-shrink-0 mt-0.5">{p.icon}</span>
                {p.text}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom CTA */}
        <div className="text-center space-y-3">
          <p className="text-xs text-muted-foreground">Still have questions?</p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-10 text-sm font-bold rounded-xl"
              onClick={() => navigate("/faq")}
            >
              Read the FAQ
            </Button>
            <Button
              className="flex-1 h-10 text-sm font-bold rounded-xl btn-glow"
              onClick={() => navigate("/pricing")}
            >
              See Pricing
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
