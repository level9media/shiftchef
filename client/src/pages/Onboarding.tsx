import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { ChefHat, Briefcase, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type UserType = "worker" | "employer" | "both";

const ROLES = [
  {
    value: "worker" as UserType,
    icon: <ChefHat size={26} strokeWidth={1.8} />,
    label: "I'm a Worker",
    desc: "Find shifts, get paid fast, build your reputation",
    color: "oklch(0.68 0.22 38 / 0.12)",
    borderActive: "oklch(0.68 0.22 38 / 0.5)",
    iconColor: "text-primary",
    perks: ["Browse live shifts near you", "Apply in one tap", "Get paid after every shift"],
  },
  {
    value: "employer" as UserType,
    icon: <Briefcase size={26} strokeWidth={1.8} />,
    label: "I'm Hiring",
    desc: "Post shifts, find verified staff, pay securely",
    color: "oklch(0.60 0.18 250 / 0.12)",
    borderActive: "oklch(0.60 0.18 250 / 0.5)",
    iconColor: "text-blue-400",
    perks: ["Post shifts from $35", "Verified worker ratings", "Secure escrow payments"],
  },
  {
    value: "both" as UserType,
    icon: <Users size={26} strokeWidth={1.8} />,
    label: "Both",
    desc: "Switch between hiring and working anytime",
    color: "oklch(0.55 0.15 155 / 0.12)",
    borderActive: "oklch(0.55 0.15 155 / 0.5)",
    iconColor: "text-emerald-400",
    perks: ["Full worker access", "Full employer access", "Switch roles anytime"],
  },
];

export default function Onboarding() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [selected, setSelected] = useState<UserType | null>(null);

  const setRole = trpc.profile.setRole.useMutation({
    onSuccess: (_data, vars) => {
      toast.success("Welcome to ShiftChef!");
      // Employers get a guided onboarding flow first
      if (vars.userType === "employer" || vars.userType === "both") {
        navigate("/employer-onboarding");
      } else {
        navigate("/feed");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [isAuthenticated, loading]);

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      style={{ paddingTop: "var(--sat)", paddingBottom: "calc(var(--sab) + 1.5rem)" }}
    >
      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 40% at 50% 0%, oklch(0.68 0.22 38 / 0.07), transparent)" }}
      />

      <div className="relative z-10 flex flex-col flex-1 px-5 pt-8 max-w-sm mx-auto w-full">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center">
            <ChefHat size={17} className="text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-black" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Shift<span className="text-primary">Chef</span>
          </span>
        </div>

        <h1 className="text-3xl font-black mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          How will you use ShiftChef?
        </h1>
        <p className="text-muted-foreground text-sm mb-7">You can always switch later from your profile.</p>

        {/* Role cards */}
        <div className="space-y-3 flex-1">
          {ROLES.map((role) => {
            const isSelected = selected === role.value;
            return (
              <button
                key={role.value}
                onClick={() => setSelected(role.value)}
                className="w-full text-left rounded-2xl p-4 border-2 transition-all duration-200 card-press"
                style={{
                  background: isSelected ? role.color : "oklch(0.10 0 0)",
                  borderColor: isSelected ? role.borderActive : "oklch(0.20 0 0)",
                }}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={cn("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0", role.iconColor)}
                    style={{ background: role.color }}
                  >
                    {role.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-black text-sm text-foreground">{role.label}</p>
                      {isSelected && <CheckCircle2 size={16} className="text-primary flex-shrink-0" strokeWidth={2.5} />}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2.5">{role.desc}</p>
                    <div className="space-y-1">
                      {role.perks.map((perk) => (
                        <div key={perk} className="flex items-center gap-1.5">
                          <div className="w-1 h-1 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                          <span className="text-[11px] text-muted-foreground">{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-6">
          <Button
            size="lg"
            className="w-full h-14 text-base font-bold rounded-2xl btn-glow"
            disabled={!selected || setRole.isPending}
            onClick={() => selected && setRole.mutate({ userType: selected })}
          >
            {setRole.isPending ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Continue <ArrowRight size={17} className="ml-2" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
