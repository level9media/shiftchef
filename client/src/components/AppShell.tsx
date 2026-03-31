import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Zap, Briefcase, User, DollarSign, Star, Bell, ChefHat, ShieldCheck, CheckCircle, X, BriefcaseBusiness, Languages } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

interface NavItem {
  href: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  label: string;
  workerOnly?: boolean;
  employerOnly?: boolean;
}

// In-app notification store (client-side, session-based)
// We build notifications from real data: pending applications, pending ratings, verification status
function useInAppNotifications(isAuthenticated: boolean) {
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const { data: myApps } = trpc.applications.myApplications.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const { data: pendingRatings } = trpc.ratings.pendingRatings.useQuery(undefined, { enabled: isAuthenticated, retry: false });

  const notifications: Array<{ id: string; icon: string; title: string; body: string; time: Date; type: string }> = [];

  // Accepted applications
  if (myApps) {
    const accepted = myApps.filter((a: any) => a.status === "accepted");
    accepted.forEach((a: any) => {
      notifications.push({
        id: `app-accepted-${a.id}`,
        icon: "✅",
        title: "Shift Confirmed!",
        body: `Your application for ${a.jobRole ?? "a shift"} was accepted. Show up on time and crush it.`,
        time: new Date(a.updatedAt ?? a.createdAt),
        type: "success",
      });
    });
    const rejected = myApps.filter((a: any) => a.status === "rejected");
    rejected.forEach((a: any) => {
      notifications.push({
        id: `app-rejected-${a.id}`,
        icon: "❌",
        title: "Application Not Selected",
        body: `You weren't selected for ${a.jobRole ?? "a shift"}. Keep applying — more shifts are live.`,
        time: new Date(a.updatedAt ?? a.createdAt),
        type: "info",
      });
    });
  }

  // Pending ratings
  if (pendingRatings && pendingRatings.length > 0) {
    notifications.push({
      id: "pending-ratings",
      icon: "⭐",
      title: `${pendingRatings.length} Rating${pendingRatings.length > 1 ? "s" : ""} Waiting`,
      body: "Rate your recent shifts to build your reputation on ShiftChef.",
      time: new Date(),
      type: "action",
    });
  }

  // Verification status
  if (profile?.verificationStatus === "pending") {
    notifications.push({
      id: "verif-pending",
      icon: "🔍",
      title: "Verification Under Review",
      body: "Your ID is being reviewed. You'll be notified once approved (usually within 24 hours).",
      time: new Date(),
      type: "info",
    });
  }
  if (profile?.verificationStatus === "verified") {
    notifications.push({
      id: "verif-approved",
      icon: "🛡️",
      title: "Identity Verified!",
      body: "Your ShiftChef profile is now verified. Employers can see your verified badge.",
      time: profile.verifiedAt ? new Date(profile.verifiedAt) : new Date(),
      type: "success",
    });
  }
  if (profile?.verificationStatus === "rejected") {
    notifications.push({
      id: "verif-rejected",
      icon: "⚠️",
      title: "Verification Needs Attention",
      body: "Your ID verification was not approved. Please re-submit with a clearer photo.",
      time: new Date(),
      type: "warning",
    });
  }

  // Contract not signed
  if (profile?.userType === "worker" && !profile?.contractSigned) {
    notifications.push({
      id: "contract-unsigned",
      icon: "📋",
      title: "Sign Your Contractor Agreement",
      body: "Sign your 1099 contractor agreement to start accepting paid shifts.",
      time: new Date(),
      type: "action",
    });
  }

  // Sort by time descending
  notifications.sort((a, b) => b.time.getTime() - a.time.getTime());
  return notifications;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const { data: profile } = trpc.profile.get.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

  const [bellOpen, setBellOpen] = useState(false);
  const { language, setLanguage, t, isSpanish } = useLanguage();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const bellRef = useRef<HTMLDivElement>(null);

  const allNotifications = useInAppNotifications(isAuthenticated);
  const visibleNotifications = allNotifications.filter((n) => !dismissed.has(n.id));
  const unreadCount = visibleNotifications.length;

  // Close bell dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    if (bellOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [bellOpen]);

  const isWorker = !profile?.userType || profile.userType === "worker" || profile.userType === "both";
  const isEmployer = profile?.userType === "employer" || profile?.userType === "both";

  const navItems: NavItem[] = [
    {
      href: "/feed",
      icon: <Zap size={22} strokeWidth={1.8} />,
      activeIcon: <Zap size={22} strokeWidth={2.5} />,
      label: isSpanish ? "En Vivo" : "Live",
    },
    {
      href: "/applications",
      icon: <Briefcase size={22} strokeWidth={1.8} />,
      activeIcon: <Briefcase size={22} strokeWidth={2.5} />,
      label: isSpanish ? "Trabajos" : "Jobs",
    },
    {
      href: "/earnings",
      icon: <DollarSign size={22} strokeWidth={1.8} />,
      activeIcon: <DollarSign size={22} strokeWidth={2.5} />,
      label: t("earnings"),
      workerOnly: true,
    },
    {
      href: "/ratings",
      icon: <Star size={22} strokeWidth={1.8} />,
      activeIcon: <Star size={22} strokeWidth={2.5} />,
      label: t("ratings"),
    },
    {
      href: "/profile",
      icon: <User size={22} strokeWidth={1.8} />,
      activeIcon: <User size={22} strokeWidth={2.5} />,
      label: t("profile"),
    },
  ];

  const visibleNav = navItems.filter((item) => {
    if (item.workerOnly && !isWorker) return false;
    if (item.employerOnly && !isEmployer) return false;
    return true;
  });

  const isAuthPage = location === "/" || location === "/onboarding";

  const notifTypeColor: Record<string, string> = {
    success: "border-l-emerald-500",
    info: "border-l-blue-500",
    action: "border-l-primary",
    warning: "border-l-yellow-500",
  };

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

            {/* Right: language toggle + role badge + bell + avatar */}
            <div className="flex items-center gap-2.5">
              {/* EN / ES toggle */}
              <button
                onClick={() => setLanguage(language === "en" ? "es" : "en")}
                className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all"
                title={language === "en" ? "Cambiar a Español" : "Switch to English"}
              >
                <Languages size={12} strokeWidth={2} />
                {language === "en" ? "ES" : "EN"}
              </button>
              {profile && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary px-2.5 py-1 rounded-full border border-border">
                  {profile.userType ?? "worker"}
                </span>
              )}

              {/* Notification bell with dropdown */}
              <div className="relative" ref={bellRef}>
                <button
                  onClick={() => setBellOpen((v) => !v)}
                  className="relative w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Bell size={16} strokeWidth={1.8} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-black flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown panel */}
                {bellOpen && (
                  <div
                    className="absolute right-0 top-11 w-80 max-h-96 overflow-y-auto rounded-2xl border border-border shadow-2xl z-50"
                    style={{ background: "oklch(0.10 0 0 / 0.98)", backdropFilter: "blur(20px)" }}
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <span className="text-sm font-bold">{isSpanish ? "Notificaciones" : "Notifications"}</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => setDismissed(new Set(allNotifications.map((n) => n.id) as string[]))}
                          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {isSpanish ? "Limpiar todo" : "Clear all"}
                        </button>
                      )}
                    </div>
                    {visibleNotifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                        <CheckCircle size={28} strokeWidth={1.5} />
                        <p className="text-sm">{isSpanish ? "Todo al día" : "You're all caught up"}</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {visibleNotifications.map((n) => (
                          <div
                            key={n.id}
                            className={cn(
                              "flex items-start gap-3 px-4 py-3 border-l-2 hover:bg-secondary/40 transition-colors",
                              notifTypeColor[n.type] ?? "border-l-border"
                            )}
                          >
                            <span className="text-lg mt-0.5 flex-shrink-0">{n.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-foreground leading-tight">{n.title}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                              <p className="text-[10px] text-muted-foreground/60 mt-1">
                                {formatDistanceToNow(n.time, { addSuffix: true })}
                              </p>
                            </div>
                            <button
                              onClick={() => setDismissed((prev) => new Set(Array.from(prev).concat(n.id)))}
                              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

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
