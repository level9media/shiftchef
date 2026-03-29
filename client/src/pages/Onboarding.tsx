import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Briefcase, HardHat, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type UserType = "worker" | "employer" | "both";

export default function Onboarding() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [selected, setSelected] = useState<UserType | null>(null);

  const setRole = trpc.profile.setRole.useMutation({
    onSuccess: () => {
      toast.success("Role set! Welcome to StaffUp.");
      navigate("/profile");
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [isAuthenticated, loading]);

  const roles: { type: UserType; icon: React.ReactNode; title: string; desc: string }[] = [
    {
      type: "worker",
      icon: <HardHat size={28} />,
      title: "I'm a Worker",
      desc: "Find shifts, get paid fast, build your reputation",
    },
    {
      type: "employer",
      icon: <Briefcase size={28} />,
      title: "I'm an Employer",
      desc: "Post shifts, hire verified staff instantly",
    },
    {
      type: "both",
      icon: <Users size={28} />,
      title: "Both",
      desc: "I hire staff and also pick up shifts",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2">
            Welcome to Staff<span className="text-primary">Up</span>
          </h1>
          <p className="text-muted-foreground">How will you use the platform?</p>
        </div>

        <div className="space-y-3 mb-8">
          {roles.map((role) => (
            <button
              key={role.type}
              onClick={() => setSelected(role.type)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                selected === role.type
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-foreground hover:border-border/80"
              )}
            >
              <div className={cn("p-2 rounded-xl", selected === role.type ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
                {role.icon}
              </div>
              <div>
                <p className="font-bold">{role.title}</p>
                <p className="text-sm text-muted-foreground">{role.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <Button
          size="lg"
          className="w-full h-14 text-base font-bold rounded-2xl"
          disabled={!selected || setRole.isPending}
          onClick={() => selected && setRole.mutate({ userType: selected })}
        >
          {setRole.isPending ? "Saving..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}
