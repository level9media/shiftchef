import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AppShell from "@/components/AppShell";
import { useLocation } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  MapPin, Clock, Star, DollarSign, X, ChefHat,
  Zap, Plus, User, ArrowRight, Navigation, List, Map
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Token ────────────────────────────────────────────────────────────────────
const MAPBOX_TOKEN = "pk.eyJ1Ijoic2hpZnRjaGVmIiwiYSI6ImNtbmgwcHFjczBmOXMycHEwYjBtMnRzZG8ifQ.kc9hWsTXbrzZej2fIo1b5g";

// ─── Constants ────────────────────────────────────────────────────────────────
const CITIES: Record<string, { lat: number; lng: number; label: string }> = {
  "Austin, TX":      { lat: 30.2672, lng: -97.7431, label: "Austin" },
  "Houston, TX":     { lat: 29.7604, lng: -95.3698, label: "Houston" },
  "Dallas, TX":      { lat: 32.7767, lng: -96.7970, label: "Dallas" },
  "San Antonio, TX": { lat: 29.4241, lng: -98.4936, label: "San Antonio" },
  "New York, NY":    { lat: 40.7128, lng: -74.0060, label: "New York" },
  "Chicago, IL":     { lat: 41.8781, lng: -87.6298, label: "Chicago" },
};

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
function calcPay(payRate: string, start: number, end: number) {
  const hours = (end - start) / (1000 * 60 * 60);
  return (parseFloat(payRate) * hours * 0.9).toFixed(0);
}

// ─── Mapbox loader ────────────────────────────────────────────────────────────
let mapboxLoaded = false;
let mapboxLoading = false;
const mapboxCallbacks: (() => void)[] = [];

function loadMapbox(cb: () => void) {
  if (mapboxLoaded) { cb(); return; }
  mapboxCallbacks.push(cb);
  if (mapboxLoading) return;
  mapboxLoading = true;

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css";
  document.head.appendChild(css);

  const script = document.createElement("script");
  script.src = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js";
  script.onload = () => {
    mapboxLoaded = true;
    mapboxCallbacks.forEach(fn => fn());
    mapboxCallbacks.length = 0;
  };
  document.head.appendChild(script);
}

// ─── Main Feed ────────────────────────────────────────────────────────────────
export default function Feed() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [city, setCity] = useState("Austin, TX");
  const [view, setView] = useState<"map" | "list">("map");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);

  const { data: profile } = trpc.profile.get.useQuery(undefined, {
    enabled: isAuthenticated, retry: false,
  });

  const { data: jobs, refetch: refetchJobs } = trpc.jobs.list.useQuery(
    { city },
    { refetchInterval: 60000 }
  );

  const applyMutation = trpc.applications.apply.useMutation({
    onSuccess: () => {
      toast.success("Application sent!");
      setSelectedJob(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const isWorker = !profile?.userType || profile.userType === "worker" || profile.userType === "both";
  const isEmployer = profile?.userType === "employer" || profile?.userType === "both";

  // ── Init Mapbox ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (view !== "map") return;
    loadMapbox(() => {
      if (!mapContainerRef.current || mapRef.current) return;
      const mbx = (window as any).mapboxgl;
      mbx.accessToken = MAPBOX_TOKEN;

      const map = new mbx.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [CITIES[city].lng, CITIES[city].lat],
        zoom: 12,
      });

      map.on("load", () => {
        mapRef.current = map;
        setMapReady(true);
      });
    });
  }, [view]);

  // ── Update markers when jobs change ─────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || !jobs) return;
    const mbx = (window as any).mapboxgl;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    jobs.forEach((job: any) => {
      if (!job.latitude || !job.longitude) return;

      const el = document.createElement("div");
      el.className = "shift-marker";
      el.innerHTML = `
        <div style="
          background: #FF6B00;
          color: white;
          border-radius: 20px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          cursor: pointer;
          border: 2px solid rgba(255,255,255,0.2);
          transition: transform 0.15s;
        ">
          $${job.payRate}/hr
        </div>
      `;
      el.addEventListener("mouseenter", () => {
        el.querySelector("div")!.style.transform = "scale(1.1)";
      });
      el.addEventListener("mouseleave", () => {
        el.querySelector("div")!.style.transform = "scale(1)";
      });
      el.addEventListener("click", () => setSelectedJob(job));

      const marker = new mbx.Marker({ element: el, anchor: "bottom" })
        .setLngLat([job.longitude, job.latitude])
        .addTo(mapRef.current);

      markersRef.current.push(marker);
    });
  }, [mapReady, jobs]);

  // ── Fly to city when changed ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    mapRef.current.flyTo({
      center: [CITIES[city].lng, CITIES[city].lat],
      zoom: 12,
      duration: 1200,
    });
  }, [city, mapReady]);

  const handleApply = useCallback((job: any) => {
    if (!isAuthenticated) { navigate("/"); return; }
    applyMutation.mutate({ jobId: job.id });
  }, [isAuthenticated, applyMutation]);

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-3.5rem-var(--sab))]">

        {/* ── Top bar ────────────────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 border-b border-border px-4 py-2.5"
          style={{ background: "oklch(0.06 0 0 / 0.97)", backdropFilter: "blur(16px)" }}
        >
          {/* City chips */}
          <div className="flex items-center gap-2 mb-2.5">
            <div className="flex-1 overflow-x-auto scrollbar-none">
              <div className="flex gap-1.5">
                {Object.entries(CITIES).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setCity(key)}
                    className={cn(
                      "flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                      city === key
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground border border-border"
                    )}
                  >
                    {val.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Map / List toggle */}
            <div className="flex-shrink-0 flex gap-0.5 bg-secondary rounded-lg p-0.5">
              <button
                onClick={() => setView("map")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all",
                  view === "map" ? "bg-card text-foreground" : "text-muted-foreground"
                )}
              >
                <Map size={11} /> Map
              </button>
              <button
                onClick={() => setView("list")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all",
                  view === "list" ? "bg-card text-foreground" : "text-muted-foreground"
                )}
              >
                <List size={11} /> List
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              <span className="text-primary font-bold">{jobs?.length ?? 0}</span> open shifts in {CITIES[city].label}
            </span>
            <span className="text-[10px] text-muted-foreground/50">· updates every 60s</span>
            {isEmployer && (
              <button
                onClick={() => navigate("/post-job")}
                className="ml-auto flex items-center gap-1 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full"
              >
                <Plus size={11} strokeWidth={2.5} /> Post shift
              </button>
            )}
          </div>
        </div>

        {/* ── Map view ───────────────────────────────────────────────────── */}
        {view === "map" && (
          <div className="relative flex-1 overflow-hidden">
            <div ref={mapContainerRef} className="w-full h-full" />

            {!mapReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-muted-foreground">Loading map...</p>
                </div>
              </div>
            )}

            {/* No jobs on map state */}
            {mapReady && jobs?.length === 0 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2">
                <div className="bg-card border border-border rounded-2xl px-4 py-3 text-center shadow-lg">
                  <p className="text-sm font-bold text-foreground">No open shifts in {CITIES[city].label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Check back soon or try another city</p>
                </div>
              </div>
            )}

            {/* Hint */}
            {mapReady && (jobs?.length ?? 0) > 0 && !selectedJob && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
                <div className="bg-card/90 border border-border rounded-full px-4 py-2 backdrop-blur-sm">
                  <p className="text-xs text-muted-foreground">Tap a shift to see details</p>
                </div>
              </div>
            )}

            {/* Slide-up job card */}
            {selectedJob && (
              <div className="absolute bottom-0 left-0 right-0 z-10">
                <JobSlideCard
                  job={selectedJob}
                  onClose={() => setSelectedJob(null)}
                  onApply={() => handleApply(selectedJob)}
                  applying={applyMutation.isPending}
                  isWorker={isWorker}
                  navigate={navigate}
                />
              </div>
            )}
          </div>
        )}

        {/* ── List view ──────────────────────────────────────────────────── */}
        {view === "list" && (
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-3 space-y-3 max-w-lg mx-auto">
              {!jobs ? (
                <ListSkeletons />
              ) : jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <ChefHat size={40} className="text-muted-foreground/20 mb-4" />
                  <p className="font-bold text-foreground mb-1">No open shifts</p>
                  <p className="text-sm text-muted-foreground">Check another city or come back soon</p>
                </div>
              ) : (
                jobs.map((job: any) => (
                  <JobListCard
                    key={job.id}
                    job={job}
                    onApply={() => handleApply(job)}
                    applying={applyMutation.isPending}
                    isWorker={isWorker}
                    navigate={navigate}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ─── Slide-up card (map view) ─────────────────────────────────────────────────
function JobSlideCard({ job, onClose, onApply, applying, isWorker, navigate }: {
  job: any; onClose: () => void; onApply: () => void;
  applying: boolean; isWorker: boolean; navigate: any;
}) {
  const hours = calcHours(job.startTime, job.endTime);
  const workerPay = calcPay(job.payRate, job.startTime, job.endTime);

  return (
    <div
      className="bg-card border-t border-border rounded-t-3xl p-5 shadow-2xl"
      style={{ animation: "slideUp 0.25s ease-out" }}
    >
      <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

      {/* Handle + close */}
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-1 bg-border rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
        <div className="flex items-center gap-2">
          <span className="text-2xl">{ROLE_EMOJI[job.role] ?? "💼"}</span>
          <div>
            <p className="font-black text-base text-foreground">{ROLE_LABELS[job.role] ?? job.role}</p>
            {job.restaurantName && <p className="text-xs text-muted-foreground">{job.restaurantName}</p>}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground"
        >
          <X size={14} />
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatBox icon={<DollarSign size={13} />} label="Pay" value={`$${job.payRate}/hr`} />
        <StatBox icon={<Clock size={13} />} label="Hours" value={`${hours}h`} />
        <StatBox icon={<DollarSign size={13} />} label="You earn" value={`~$${workerPay}`} accent />
      </div>

      {/* Time + location */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock size={12} className="text-primary flex-shrink-0" />
          <span>{formatDate(job.startTime)} · {formatTime(job.startTime)} – {formatTime(job.endTime)}</span>
        </div>
        {job.location && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin size={12} className="text-primary flex-shrink-0" />
            <span>{job.location}</span>
          </div>
        )}
        {job.minRating && job.minRating > 1 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Star size={12} className="text-yellow-400 flex-shrink-0" />
            <span>Min rating {job.minRating.toFixed(1)} required</span>
          </div>
        )}
      </div>

      {/* Description */}
      {job.description && (
        <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{job.description}</p>
      )}

      {/* CTA */}
      {isWorker ? (
        <button
          onClick={onApply}
          disabled={applying}
          className="w-full h-12 bg-primary text-primary-foreground font-black text-sm rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {applying ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <><Zap size={15} strokeWidth={2.5} /> Apply Now</>
          )}
        </button>
      ) : (
        <button
          onClick={() => navigate("/feed")}
          className="w-full h-12 bg-secondary text-foreground font-bold text-sm rounded-2xl"
        >
          Sign in as worker to apply
        </button>
      )}
    </div>
  );
}

// ─── List card ────────────────────────────────────────────────────────────────
function JobListCard({ job, onApply, applying, isWorker, navigate }: {
  job: any; onApply: () => void; applying: boolean;
  isWorker: boolean; navigate: any;
}) {
  const hours = calcHours(job.startTime, job.endTime);
  const workerPay = calcPay(job.payRate, job.startTime, job.endTime);

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center text-xl">
              {ROLE_EMOJI[job.role] ?? "💼"}
            </div>
            <div>
              <p className="font-black text-sm text-foreground">{ROLE_LABELS[job.role] ?? job.role}</p>
              {job.restaurantName && (
                <p className="text-xs text-muted-foreground mt-0.5">{job.restaurantName}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="font-black text-base text-primary">${job.payRate}<span className="text-xs font-normal text-muted-foreground">/hr</span></p>
            <p className="text-[10px] text-muted-foreground">~${workerPay} total</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock size={11} className="text-primary/70" />
            <span>{formatDate(job.startTime)} · {formatTime(job.startTime)} – {formatTime(job.endTime)} · {hours}h</span>
          </div>
          {job.location && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin size={11} className="text-primary/70" />
              <span className="truncate">{job.location}</span>
            </div>
          )}
          {job.minRating && job.minRating > 1 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Star size={11} className="text-yellow-400/70" />
              <span>Min {job.minRating.toFixed(1)} rating</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {job.isPermanent && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
              Perm potential
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">
            {job.applicationCount ?? 0} applied
          </span>
        </div>
        {isWorker ? (
          <button
            onClick={onApply}
            disabled={applying}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-black px-4 py-2 rounded-xl disabled:opacity-60"
          >
            <Zap size={11} strokeWidth={2.5} />
            Apply
          </button>
        ) : (
          <button
            onClick={() => navigate("/")}
            className="text-xs font-bold text-primary"
          >
            Sign in →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StatBox({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: string; accent?: boolean;
}) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-0.5 rounded-xl py-2.5 px-2",
      accent ? "bg-primary/15 border border-primary/30" : "bg-secondary"
    )}>
      <span className={cn("text-[10px]", accent ? "text-primary" : "text-muted-foreground")}>
        {label}
      </span>
      <span className={cn("text-sm font-black", accent ? "text-primary" : "text-foreground")}>
        {value}
      </span>
    </div>
  );
}

function ListSkeletons() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-card rounded-2xl border border-border p-4 space-y-3 animate-pulse">
          <div className="flex gap-3">
            <div className="w-11 h-11 rounded-xl bg-secondary" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-secondary rounded w-1/2" />
              <div className="h-3 bg-secondary rounded w-1/3" />
            </div>
          </div>
          <div className="h-3 bg-secondary rounded w-2/3" />
          <div className="h-3 bg-secondary rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
