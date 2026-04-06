import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AppShell from "@/components/AppShell";
import { useLocation } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Clock, Star, DollarSign, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MAPBOX_TOKEN = "pk.eyJ1Ijoic2hpZnRjaGVmIiwiYSI6ImNtbmgwcHFjczBmOXMycHEwYjBtMnRzZG8ifQ.kc9hWsTXbrzZej2fIo1b5g";

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

export default function MapFeed() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [city, setCity] = useState("Austin, TX");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);

  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const { data: jobs } = trpc.jobs.list.useQuery({ city }, { refetchInterval: 60000 });

  const applyMutation = trpc.applications.applyToJob.useMutation({
    onSuccess: () => { toast.success("Application sent!"); setSelectedJob(null); },
    onError: (e) => toast.error(e.message),
  });

  const isWorker = !profile?.userType || profile.userType === "worker";

  useEffect(() => {
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
      map.on("load", () => { mapRef.current = map; setMapReady(true); });
    });
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !jobs) return;
    const mbx = (window as any).mapboxgl;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    jobs.forEach((job: any) => {
      if (!job.latitude || !job.longitude) return;
      const el = document.createElement("div");
      el.innerHTML = `<div style="background:#FF6B00;color:white;border-radius:20px;padding:4px 10px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.4);cursor:pointer;border:2px solid rgba(255,255,255,0.2);">$${job.payRate}/hr</div>`;
      el.addEventListener("click", () => setSelectedJob(job));
      const marker = new mbx.Marker({ element: el, anchor: "bottom" })
        .setLngLat([job.longitude, job.latitude])
        .addTo(mapRef.current);
      markersRef.current.push(marker);
    });
  }, [mapReady, jobs]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    mapRef.current.flyTo({ center: [CITIES[city].lng, CITIES[city].lat], zoom: 12, duration: 1200 });
  }, [city, mapReady]);

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-3.5rem-var(--sab))]">
        {/* City selector */}
        <div className="flex-shrink-0 border-b border-border px-4 py-2.5" style={{ background: "oklch(0.06 0 0 / 0.97)" }}>
          <div className="overflow-x-auto scrollbar-none">
            <div className="flex gap-1.5">
              {Object.entries(CITIES).map(([key, val]) => (
                <button key={key} onClick={() => setCity(key)}
                  className={cn("flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                    city === key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground border border-border"
                  )}>
                  {val.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <span className="text-primary font-bold">{jobs?.length ?? 0}</span> live shifts · tap a pin to apply
          </p>
        </div>

        {/* Map */}
        <div className="relative flex-1 overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full" />
          {!mapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {mapReady && (jobs?.length ?? 0) > 0 && !selectedJob && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="bg-card/90 border border-border rounded-full px-4 py-2 backdrop-blur-sm">
                <p className="text-xs text-muted-foreground">Tap a shift pin to see details</p>
              </div>
            </div>
          )}
          {mapReady && jobs?.length === 0 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2">
              <div className="bg-card border border-border rounded-2xl px-4 py-3 text-center shadow-lg">
                <p className="text-sm font-bold text-foreground">No open shifts in {CITIES[city].label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Check back soon</p>
              </div>
            </div>
          )}
          {selectedJob && (
            <div className="absolute bottom-0 left-0 right-0 z-10">
              <div className="bg-card border-t border-border rounded-t-3xl p-5 shadow-2xl" style={{ animation: "slideUp 0.25s ease-out" }}>
                <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{ROLE_EMOJI[selectedJob.role] ?? "💼"}</span>
                    <div>
                      <p className="font-black text-base text-foreground">{ROLE_LABELS[selectedJob.role] ?? selectedJob.role}</p>
                      {selectedJob.restaurantName && <p className="text-xs text-muted-foreground">{selectedJob.restaurantName}</p>}
                    </div>
                  </div>
                  <button onClick={() => setSelectedJob(null)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <X size={14} className="text-muted-foreground" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-secondary rounded-xl py-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground">Pay</p>
                    <p className="text-sm font-black text-foreground">${selectedJob.payRate}/hr</p>
                  </div>
                  <div className="bg-secondary rounded-xl py-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground">Hours</p>
                    <p className="text-sm font-black text-foreground">{calcHours(selectedJob.startTime, selectedJob.endTime)}h</p>
                  </div>
                  <div className="bg-primary/15 border border-primary/30 rounded-xl py-2.5 text-center">
                    <p className="text-[10px] text-primary">You earn</p>
                    <p className="text-sm font-black text-primary">~${calcPay(selectedJob.payRate, selectedJob.startTime, selectedJob.endTime)}</p>
                  </div>
                </div>
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock size={12} className="text-primary" />
                    {formatDate(selectedJob.startTime)} · {formatTime(selectedJob.startTime)} – {formatTime(selectedJob.endTime)}
                  </div>
                  {selectedJob.location && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin size={12} className="text-primary" />
                      {selectedJob.location}
                    </div>
                  )}
                </div>
                {isWorker ? (
                  <button
                    onClick={() => applyMutation.mutate({ jobId: selectedJob.id })}
                    disabled={applyMutation.isPending}
                    className="w-full h-12 bg-primary text-primary-foreground font-black text-sm rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {applyMutation.isPending
                      ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      : <><Zap size={15} strokeWidth={2.5} /> Apply Now</>}
                  </button>
                ) : (
                  <button onClick={() => navigate("/")} className="w-full h-12 bg-secondary text-foreground font-bold text-sm rounded-2xl">
                    Sign in as worker to apply
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}