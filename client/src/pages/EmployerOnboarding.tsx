import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Sparkles, ChevronRight, CheckCircle2, X, Mail,
  DollarSign, Users, Star, Zap, ArrowRight, Clock
} from "lucide-react";

const STEPS = [
  {
    id: 1,
    icon: Sparkles,
    title: "Welcome to ShiftChef",
    subtitle: "Austin's fastest kitchen staffing platform",
    content: (
      <div className="space-y-4">
        <p className="text-white/70 text-sm leading-relaxed">
          You're now connected to Austin's pool of verified kitchen workers — cooks, sous chefs, servers, dishwashers, and more. Most shifts are filled in under 2 hours.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Clock, label: "Avg fill time", value: "< 2 hrs" },
            { icon: Users, label: "Active workers", value: "500+" },
            { icon: Star, label: "Avg worker rating", value: "4.6 / 5" },
            { icon: DollarSign, label: "Platform fee", value: "10%" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl bg-white/5 border border-white/5 p-3">
              <Icon className="w-4 h-4 text-[#FF6B00] mb-1" />
              <p className="text-lg font-bold text-white font-display">{value}</p>
              <p className="text-xs text-white/40">{label}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 2,
    icon: Zap,
    title: "Post Your First Job",
    subtitle: "Takes 2 minutes — workers apply within the hour",
    content: (
      <div className="space-y-3">
        {[
          { step: "1", title: "Choose the role", desc: "Cook, sous chef, server, dishwasher, cleaner, prep, bartender" },
          { step: "2", title: "Set your pay rate", desc: "We recommend 10–15% above market to fill faster. Austin avg: $17–28/hr" },
          { step: "3", title: "Pick your shift time", desc: "Set start and end time — workers see the exact hours" },
          { step: "4", title: "Set minimum rating", desc: "Filter out low-rated workers. We recommend 3.5+ for kitchen roles" },
          { step: "5", title: "Pay to post", desc: "$35 single / $75 for 3 posts / $99/mo unlimited. Payment held until shift completes." },
        ].map(({ step, title, desc }) => (
          <div key={step} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-[#FF6B00] flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">{step}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="text-xs text-white/50 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 3,
    icon: Mail,
    title: "Your Onboarding Email Sequence",
    subtitle: "3 emails to help you get the most out of ShiftChef",
    content: (
      <div className="space-y-3">
        {[
          {
            num: "01",
            subject: "Welcome — Your First Shift is 2 Hours Away",
            timing: "Sent now",
            desc: "Platform overview, how to post your first job, and a free first-post promo code.",
          },
          {
            num: "02",
            subject: "The $99/Month Math That Makes Operators Smile",
            timing: "Day 3",
            desc: "ROI breakdown of the unlimited subscription vs. per-post pricing. One covered no-show pays for the month.",
          },
          {
            num: "03",
            subject: "3 Austin Operators Share What Changed",
            timing: "Day 7",
            desc: "Social proof from real Austin restaurants. Real results, real numbers.",
          },
        ].map(({ num, subject, timing, desc }) => (
          <div key={num} className="rounded-xl bg-white/5 border border-white/5 p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#FF6B00] font-display">{num}</span>
                <p className="text-sm font-semibold text-white leading-tight">{subject}</p>
              </div>
              <span className="text-xs text-white/30 shrink-0">{timing}</span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
          </div>
        ))}
        <p className="text-xs text-white/30 text-center">
          Emails are sent to your registered address. You can unsubscribe at any time.
        </p>
      </div>
    ),
  },
];

export default function EmployerOnboarding() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const { data: onboardingData } = trpc.onboarding.status.useQuery();
  const triggerWelcomeMutation = trpc.onboarding.triggerWelcome.useMutation();
  const dismissMutation = trpc.onboarding.dismiss.useMutation({
    onSuccess: () => {
      setDismissed(true);
      navigate("/feed");
    },
  });
  const completeStepMutation = trpc.onboarding.completeStep.useMutation();

  // Trigger welcome notification on mount
  useEffect(() => {
    if (onboardingData?.user && !onboardingData.user.onboardingEmailSent) {
      triggerWelcomeMutation.mutate();
    }
  }, [onboardingData?.user?.onboardingEmailSent]);

  const step = STEPS[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === STEPS.length - 1;

  function handleNext() {
    completeStepMutation.mutate({ step: currentStep + 1 });
    if (isLast) {
      dismissMutation.mutate();
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  function handleSkip() {
    dismissMutation.mutate();
  }

  if (dismissed) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Header */}
      <div className="px-4 pt-14 pb-4 flex items-center justify-between">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === currentStep ? "w-8 bg-[#FF6B00]" : i < currentStep ? "w-4 bg-[#FF6B00]/50" : "w-4 bg-white/10"
              }`}
            />
          ))}
        </div>
        <button
          onClick={handleSkip}
          className="text-xs text-white/40 flex items-center gap-1 active:text-white/60"
        >
          Skip <X className="w-3 h-3" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pt-4 pb-8 flex flex-col">
        {/* Icon + Title */}
        <div className="mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center mb-4">
            <StepIcon className="w-7 h-7 text-[#FF6B00]" />
          </div>
          <h2 className="text-2xl font-bold text-white font-display leading-tight">{step.title}</h2>
          <p className="text-sm text-white/50 mt-1">{step.subtitle}</p>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto">
          {step.content}
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-10 space-y-3">
        <button
          onClick={handleNext}
          className="w-full h-14 rounded-2xl bg-[#FF6B00] text-white font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          {isLast ? (
            <>
              Post Your First Job <ArrowRight className="w-5 h-5" />
            </>
          ) : (
            <>
              Next <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>

        {currentStep > 0 && (
          <button
            onClick={() => setCurrentStep((s) => s - 1)}
            className="w-full h-10 text-sm text-white/40 active:text-white/60"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}
