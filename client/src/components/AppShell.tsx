import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Zap, Briefcase, User, DollarSign, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  workerOnly?: boolean;
  employerOnly?: boolean;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { data: profile } = trpc.profile.get.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

  const isWorker = !profile?.userType || profile.userType === "worker" || profile.userType === "both";
  const isEmployer = profile?.userType === "employer" || profile?.userType === "both";

  const navItems: NavItem[] = [
    { href: "/feed", icon: <Zap size={20} />, label: "Live" },
    { href: "/applications", icon: <Briefcase size={20} />, label: "Jobs" },
    { href: "/earnings", icon: <DollarSign size={20} />, label: "Earnings", workerOnly: true },
    { href: "/ratings", icon: <Star size={20} />, label: "Ratings" },
    { href: "/profile", icon: <User size={20} />, label: "Profile" },
  ];

  const visibleNav = navItems.filter((item) => {
    if (item.workerOnly && !isWorker) return false;
    if (item.employerOnly && !isEmployer) return false;
    return true;
  });

  const isAuthPage = location === "/" || location === "/onboarding";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top header */}
      {!isAuthPage && (
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between px-4 h-14">
            <Link href="/feed">
              <span className="text-xl font-black tracking-tight">
                Staff<span className="text-primary">Up</span>
              </span>
            </Link>
            {profile && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground capitalize bg-secondary px-2 py-0.5 rounded-full">
                  {profile.userType ?? "worker"}
                </span>
                {profile.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt={profile.name ?? ""}
                    className="w-8 h-8 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {(profile.name ?? "U")[0].toUpperCase()}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>
      )}

      {/* Main content */}
      <main className={cn("flex-1", !isAuthPage && "pb-20")}>
        {children}
      </main>

      {/* Bottom navigation */}
      {!isAuthPage && isAuthenticated && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border bottom-nav">
          <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
            {visibleNav.map((item) => {
              const isActive = location.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <button
                    className={cn(
                      "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-[56px]",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.icon}
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </button>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
