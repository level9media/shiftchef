import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AppShell from "@/components/AppShell";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import {
  MapPin, Clock, Star, TrendingUp, Flag,
  Zap, Plus, RefreshCw, User, ChefHat, ArrowRight, ShieldCheck,
  Search, SlidersHorizontal, X, Navigation
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const CITIES = ["Austin, TX", "Houston, TX", "Dallas, TX", "San Antonio, TX", "New York, NY", "Chicago, IL"];

const ROLE_LABELS: Record<string, string> = {
  cook: "Cook", sous_chef: "Sous Chef", prep: "Prep Cook",
  dishwasher: "Dishwasher", cleaner: "Cleaner", server: "Server",
  bartender: "Bartender", host: "Host", manager: "Manager",
};

const ROLE_EMOJI: Record<string, string> = {
  cook: "👨‍🍳", sous_chef: "🍴", prep: "🥗", dishwasher: "🫧",
  cleaner: "🧹", server: "🍽️", bartender: "🍸", host: "🤝", manager: "📋",
};

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatDate(ms: number) {
  const d = new Date(ms);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}
function calcHours(start: number, end: number) {
  return ((end - start) / (1000 * 60 * 60)).toFixed(1);
}

export default function Feed() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [city, setCity] = useState("Austin, TX");
  const [tab, setTab] = useState<"jobs" | "workers">("jobs");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterMinPay, setFilterMinPay] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);

  // Auto-detect city on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      if (lat > 29.5 && lat < 30.8 && lng > -98.2 && lng < -97.2) setCity("Austin, TX");
      else if (lat > 29.0 && lat < 30.1 && lng > -96.0 && lng < -94.8) setCity("Houston, TX");
      else if (lat > 32.5 && lat < 33.3 && lng > -97.2 && lng < -96.2) setCity("Dallas, TX");
      else if (lat > 29.1 && lat < 29.8 && lng > -98.8 && lng < -98.1) setCity("San Antonio, TX");
      else if (lat > 40.4 && lat < 40.9 && lng > -74.3 && lng < -73.6) setCity("New York, NY");
      else if (lat > 41.6 && lat < 42.1 && lng > -88.0 && lng < -87.4) setCity("Chicago, IL");
    }, () => {});
  }, []);

  const handleGeolocate = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let detected = "Austin, TX";
        if (lat > 29.5 && lat < 30.8 && lng > -98.2 && lng < -97.2) detected = "Austin, TX";
        else if (lat > 29.0 && lat < 30.1 && lng > -96.0 && lng < -94.8) detected = "Houston, TX";
        else if (lat > 32.5 && lat < 33.3 && lng > -97.2 && lng < -96.2) detected = "Dallas, TX";
        else if (lat > 29.1 && lat < 29.8 && lng > -98.8 && lng < -98.1) detected = "San Antonio, TX";
        else if (lat > 40.4 && lat < 40.9 && lng > -74.3 && lng < -73.6) detected = "New York, NY";
        else if (lat > 41.6 && lat < 42.1 && lng > -88.0 && lng < -87.4) detected = "Chicago, IL";
        setCity(detected);
        setIsGeolocating(false);
        toast.success(`Showing shifts near you in ${detected}`);
      },
      () => { setIsGeolocating(false); toast.error("Could not detect location"); }
    );
  };

  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const { data: jobs, isLoading: jobsLoading, refetch: refetchJobs } = trpc.jobs.list.useQuery(
    { city }, { refetchInterval: 30000 }
  );
  const { data: availableWorkers, isLoading: workersLoading, refetch: refetchWorkers } = trpc.availability.list.useQuery(
    { city }, { refetchInterval: 30000 }
  );

  const isEmployer = profile?.userType === "employer" || profile?.userType === "both";
  const isWorker = !profile?.userType || profile.userType === "worker" || profile.userType === "both";

  // Client-side filtering
  const filteredJobs = (jobs ?? []).filter((job: any) => {
    if (filterRole && job.role !== filterRole) return false;
    if (filterMinPay && parseFloat(job.payRate) < parseFloat(filterMinPay)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const roleLabel = (ROLE_LABELS[job.role] ?? job.role ?? "").toLowerCase();
      const desc = (job.description ?? "").toLowerCase();
      const loc = (job.location ?? "").toLowerCase();
      if (!roleLabel.includes(q) && !desc.includes(q) && !loc.includes(q)) return false;
    }
    return true;
  });

  const filteredWorkers = (availableWorkers ?? []).filter((w: any) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const roles = (w.roles ?? "").toLowerCase();
      const bio = (w.bio ?? "").toLowerCase();
      const name = (w.workerName ?? "").toLowerCase();
      if (!roles.includes(q) && !bio.includes(q) && !name.includes(q)) return false;
    }
    return true;
  });

  const activeFilterCount = [filterRole, filterMinPay].filter(Boolean).length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchJobs(), refetchWorkers()]);
    setIsRefreshing(false);
    toast.success("Feed updated");
  };

  return (
    <AppShell>
      <SEOHead
        title="Live Kitchen Shifts — Austin Hospitality Jobs"
        description="Browse live kitchen and FOH shifts in Austin. Cook, sous chef, prep, dishwasher, server, bartender jobs available now. Apply in seconds."
        canonicalPath="/feed"
      />
      <div className="max-w-lg mx-auto">
        {/* ── Sticky sub-header ─────────────────────────────────────────── */}
        <div
          className="sticky z-30 border-b border-border px-4 py-3"
          style={{
            top: "calc(3.5rem + var(--sat))",
            background: "oklch(0.06 0 0 / 0.95)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          {/* Search bar row */}
          <div className="flex items-center gap-2 mb-2.5">
            <div className="flex-1 relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search roles, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X size={11} />
                </button>
              )}
            </div>
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                "relative flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
                showFilters || activeFilterCount > 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              <SlidersHorizontal size={14} />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-black flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
            {/* Geolocate */}
            <button
              onClick={handleGeolocate}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Navigation size={14} className={cn(isGeolocating && "animate-pulse text-primary")} />
            </button>
            <button
              onClick={handleRefresh}
              className="flex-shrink-0 w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw size={13} className={cn(isRefreshing && "animate-spin")} />
            </button>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="mb-2.5 p-3 bg-secondary/60 rounded-xl border border-border space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Role</label>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">All Roles</option>
                    {Object.entries(ROLE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Min Pay</label>
                  <select
                    value={filterMinPay}
                    onChange={(e) => setFilterMinPay(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">Any</option>
                    <option value="15">$15+/hr</option>
                    <option value="18">$18+/hr</option>
                    <option value="20">$20+/hr</option>
                    <option value="25">$25+/hr</option>
                    <option value="30">$30+/hr</option>
                  </select>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => { setFilterRole(""); setFilterMinPay(""); }}
                  className="text-[10px] text-primary font-bold hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* City chips */}
          <div className="flex items-center gap-2">
            <div className="flex-1 overflow-x-auto scrollbar-none">
              <div className="flex gap-1.5">
                {CITIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCity(c)}
                    className={cn(
                      "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-150 whitespace-nowrap",
                      city === c
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground border border-border"
                    )}
                  >
                    {c.split(",")[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-2.5 bg-secondary rounded-xl p-1">
            {(["jobs", "workers"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all duration-150",
                  tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                {t === "jobs" ? <Zap size={11} strokeWidth={2.5} /> : <User size={11} strokeWidth={2.5} />}
                {t === "jobs" ? "Live Shifts" : "Available Now"}
                {t === "jobs" && filteredJobs.length > 0 && (
                  <span className="bg-primary text-primary-foreground text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
                    {filteredJobs.length}
                  </span>
                )}
                {t === "workers" && filteredWorkers.length > 0 && (
                  <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
                    {filteredWorkers.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Feed content ──────────────────────────────────────────────── */}
        <div className="px-4 py-4 space-y-3">
          {tab === "jobs" ? (
            <>
              {isEmployer && (
                <button
                  onClick={() => navigate("/post-job")}
                  className="w-full flex items-center justify-between bg-primary/10 border border-primary/30 rounded-2xl p-4 card-press"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                      <Plus size={18} className="text-primary-foreground" strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm text-foreground">Post a Shift</p>
                      <p className="text-xs text-muted-foreground">From $35 · Get applicants fast</p>
                    </div>
                  </div>
                  <ArrowRight size={15} className="text-primary" />
                </button>
              )}

              {jobsLoading ? (
                <JobSkeletons />
              ) : !filteredJobs.length ? (
                <EmptyState
                  icon={<Zap size={36} className="text-muted-foreground/30" />}
                  title={searchQuery || activeFilterCount > 0 ? "No matches" : "No live shifts"}
                  desc={searchQuery || activeFilterCount > 0 ? "Try adjusting your search or filters." : `No shifts posted in ${city.split(",")[0]} right now. Check back soon.`}
                />
              ) : (
                filteredJobs.map((job: any, i: number) => (
                  <JobCard key={job.id} job={job} index={i} onClick={() => navigate(`/jobs/${job.id}`)} />
                ))
              )}
            </>
          ) : (
            <>
              {isWorker && (
                <button
                  onClick={() => navigate("/availability")}
                  className="w-full flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 card-press"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Zap size={18} className="text-emerald-400" strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm text-foreground">Post Availability</p>
                      <p className="text-xs text-muted-foreground">Let employers find you now</p>
                    </div>
                  </div>
                  <ArrowRight size={15} className="text-emerald-400" />
                </button>
              )}

              {workersLoading ? (
                <WorkerSkeletons />
              ) : !filteredWorkers.length ? (
                <EmptyState
                  icon={<User size={36} className="text-muted-foreground/30" />}
                  title={searchQuery ? "No matches" : "No workers available"}
                  desc={searchQuery ? "Try a different search term." : `No workers posted availability in ${city.split(",")[0]} right now.`}
                />
              ) : (
                filteredWorkers.map((post: any, i: number) => (
                  <WorkerCard key={post.id} post={post} index={i} />
                ))
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

/* ── Job Card ──────────────────────────────────────────────────────────────── */
function JobCard({ job, index, onClick }: { job: any; index: number; onClick: () => void }) {
  const hours = calcHours(job.startTime, job.endTime);
  const totalPay = job.totalPay ? parseFloat(job.totalPay) : parseFloat(job.payRate) * parseFloat(hours);

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card rounded-2xl border border-border overflow-hidden card-press fade-in-up",
        `card-${Math.min(index + 1, 5)}`
      )}
    >
      {/* Visual header */}
      <div className="relative h-36 bg-secondary flex items-center justify-center overflow-hidden">
        {job.restaurantImage ? (
          <img src={job.restaurantImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-5xl">{ROLE_EMOJI[job.role] ?? "🍽️"}</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/20 to-transparent" />

        {/* Type badge */}
        <div className="absolute top-3 left-3">
          {job.isPermanent ? (
            <span className="flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full">
              <TrendingUp size={9} strokeWidth={3} /> Perm Potential
            </span>
          ) : (
            <span className="flex items-center gap-1 bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full">
              <Flag size={9} strokeWidth={3} /> Temp
            </span>
          )}
        </div>

        {/* Pay rate */}
        <div className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm rounded-xl px-3 py-1.5">
          <span className="text-xl font-black text-primary">${job.payRate}</span>
          <span className="text-xs text-muted-foreground">/hr</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-black text-base text-foreground">{ROLE_LABELS[job.role] ?? job.role}</h3>
            {job.restaurantName && <p className="text-xs text-muted-foreground mt-0.5">{job.restaurantName}</p>}
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-foreground">~${totalPay.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">total</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <MetaPill icon={<Clock size={10} />}>
            {formatDate(job.startTime)} · {formatTime(job.startTime)}–{formatTime(job.endTime)} ({hours}h)
          </MetaPill>
          {job.city && <MetaPill icon={<MapPin size={10} />}>{job.city.split(",")[0]}</MetaPill>}
          {job.minRating > 0 && <MetaPill icon={<Star size={10} />}>{job.minRating}★ min</MetaPill>}
        </div>

        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Worker earns <span className="text-emerald-400 font-bold">${(totalPay * 0.9).toFixed(0)}</span>
          </span>
          <span className="text-xs font-bold text-primary flex items-center gap-1">
            View & Apply <ArrowRight size={11} />
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Worker Card ───────────────────────────────────────────────────────────── */
function WorkerCard({ post, index }: { post: any; index: number }) {
  const skills: string[] = (() => {
    try { return JSON.parse(post.skills || "[]"); } catch { return []; }
  })();

  return (
    <div className={cn("bg-card rounded-2xl border border-border p-4 card-press fade-in-up", `card-${Math.min(index + 1, 5)}`)}>
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          {post.worker?.profileImage ? (
            <img src={post.worker.profileImage} alt="" className="w-12 h-12 rounded-2xl object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center">
              <ChefHat size={20} className="text-primary" />
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-card" />
          {post.worker?.verificationStatus === "verified" && (
            <div className="absolute -top-1 -left-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-card flex items-center justify-center">
              <ShieldCheck size={8} className="text-white" strokeWidth={3} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="font-bold text-sm text-foreground truncate">{post.worker?.name ?? "Chef"}</p>
            {post.worker?.rating && (
              <span className="flex items-center gap-0.5 text-xs text-yellow-400 font-bold">
                <Star size={10} strokeWidth={2.5} />
                {parseFloat(post.worker.rating).toFixed(1)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1 mb-2">
            {skills.slice(0, 3).map((s: string) => (
              <span key={s} className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                {ROLE_LABELS[s] ?? s}
              </span>
            ))}
            {skills.length > 3 && <span className="text-[10px] text-muted-foreground">+{skills.length - 3}</span>}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-0.5"><MapPin size={9} />{post.city?.split(",")[0] ?? "Austin"}</span>
            <span className="flex items-center gap-0.5"><Clock size={9} />{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
          </div>
        </div>
      </div>

      {post.note && (
        <p className="mt-3 text-xs text-muted-foreground italic border-t border-border pt-3">"{post.note}"</p>
      )}
    </div>
  );
}

/* ── Skeletons ─────────────────────────────────────────────────────────────── */
function JobSkeletons() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="skeleton h-36 rounded-none" />
          <div className="p-4 space-y-2">
            <div className="skeleton h-5 w-2/3" />
            <div className="skeleton h-3 w-1/2" />
            <div className="flex gap-2 mt-3">
              <div className="skeleton h-5 w-28 rounded-full" />
              <div className="skeleton h-5 w-16 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkerSkeletons() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card rounded-2xl border border-border p-4 flex gap-3">
          <div className="skeleton w-12 h-12 rounded-2xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-1/3" />
            <div className="flex gap-1">
              <div className="skeleton h-4 w-14 rounded-full" />
              <div className="skeleton h-4 w-14 rounded-full" />
            </div>
            <div className="skeleton h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */
function MetaPill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded-full">
      {icon}{children}
    </span>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4">{icon}</div>
      <p className="font-bold text-foreground mb-1">{title}</p>
      <p className="text-sm text-muted-foreground max-w-xs">{desc}</p>
    </div>
  );
}
