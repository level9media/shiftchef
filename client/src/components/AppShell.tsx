import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Zap, Briefcase, User, DollarSign, Star, Bell, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

interface NavItem {
  href: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  label: string;
  workerOnly?: boolean;
  employerOnly?: boolean;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const { data: profile } = trpc.profile.get.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

  const isWorker = !profile?.userType || profile.userType === "worker" || profile.userType === "both";
  const isEmployer = profile?.userType === "employer" || profile?.userType === "both";

  const navItems: NavItem[] = [
    {
      href: "/feed",
      icon: <Zap size={22} strokeWidth={1.8} />,
      activeIcon: <Zap size={22} strokeWidth={2.5} />,
      label: "Live",
    },
    {
      href: "/applications",
      icon: <Briefcase size={22} strokeWidth={1.8} />,
      activeIcon: <Briefcase size={22} strokeWidth={2.5} />,
      label: "Jobs",
    },
    {
      href: "/earnings",
      icon: <DollarSign size={22} strokeWidth={1.8} />,
      activeIcon: <DollarSign size={22} strokeWidth={2.5} />,
      label: "Earnings",
      workerOnly: true,
    },
    {
      href: "/ratings",
      icon: <Star size={22} strokeWidth={1.8} />,
      activeIcon: <Star size={22} strokeWidth={2.5} />,
      label: "Ratings",
    },
    {
      href: "/profile",
      icon: <User size={22} strokeWidth={1.8} />,
      activeIcon: <User size={22} strokeWidth={2.5} />,
      label: "Profile",
    },
  ];

  const visibleNav = navItems.filter((item) => {
    if (item.workerOnly && !isWorker) return false;
    if (item.employerOnly && !isEmployer) return false;
    return true;
  });

  const isAuthPage = location === "/" || location === "/onboarding";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Top header ──────────────────────────────────────────────────── */}
      {!isAuthPage && (
        <header
          className="sticky top-0 z-40 border-b border-border"
          style={{
            background: "oklch(0.06 0 0 / 0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            paddingTop: "var(--sat)",
          }}
        >
          <div className="flex items-center justify-between px-4 h-14">
            {/* Logo */}
            <Link href="/feed">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                  <ChefHat size={16} className="text-primary-foreground" strokeWidth={2.5} />
                </div>
                <span className="text-lg font-black tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Shift<span className="text-primary">Chef</span>
                </span>
              </div>
            </Link>

            {/* Right: role badge + avatar */}
            <div className="flex items-center gap-2.5">
              {profile && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary px-2.5 py-1 rounded-full border border-border">
                  {profile.userType ?? "worker"}
                </span>
              )}
              {/* Notification bell placeholder */}
              <button className="relative w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <Bell size={16} strokeWidth={1.8} />
              </button>
              {/* Avatar */}
              {profile && (
                <Link href="/profile">
                  {profile.profileImage ? (
                    <img
                      src={profile.profileImage}
                      alt={profile.name ?? ""}
                      className="w-9 h-9 rounded-xl object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                      {(profile.name ?? "U")[0].toUpperCase()}
                    </div>
                  )}
                </Link>
              )}
            </div>
          </div>
        </header>
      )}

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className={cn("flex-1", !isAuthPage && "pb-safe")}>
        {children}
      </main>

      {/* ── Bottom navigation ───────────────────────────────────────────── */}
      {!isAuthPage && isAuthenticated && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bottom-nav-safe"
          style={{
            background: "oklch(0.08 0 0 / 0.96)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <div className="flex items-stretch justify-around max-w-lg mx-auto px-1 h-16">
            {visibleNav.map((item) => {
              const isActive = location === item.href || location.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href} className="flex-1">
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center gap-0.5 h-full rounded-xl mx-0.5 transition-all duration-150",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <div className={cn("transition-transform duration-150", isActive && "scale-110")}>
                      {isActive ? (item.activeIcon ?? item.icon) : item.icon}
                    </div>
                    <span className={cn("text-[10px] font-semibold tracking-tight", isActive ? "text-primary" : "text-muted-foreground")}>
                      {item.label}
                    </span>
                    {isActive && <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
