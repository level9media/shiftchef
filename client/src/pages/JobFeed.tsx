import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AppShell from "@/components/AppShell";
import { useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Clock, MapPin, Star, Zap, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CITIES: Record<string, { label: string }> = {
  "Austin, TX":      { label: "Austin" },
  "Houston, TX":     { label: "Houston" },
  "Dallas, TX":      { label: "Dallas" },
  "San Antonio, TX": { label: "San Antonio" },
  "New York, NY":    { label: "New York" },
  "Chicago, IL":     { label: "Chicago" },
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

const GOOGLE_PLACES_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

// Cache photo URLs so we don't re-fetch
const photoCache: Record<string, string | null> = {};

async function fetchPlacePhoto(restaurantName: string, location: string): Promise<string | null> {
  const cacheKey = `${restaurantName}|${location}`;
  if (cacheKey in photoCache) return photoCache[cacheKey];

  try {
    const query = encodeURIComponent(`${restaurantName} ${location}`);
    const searchRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=photos,place_id&key=${GOOGLE_PLACES_KEY}`
    );
    const searchData = await searchRes.json();
    const photoRef = searchData?.candidates?.[0]?.photos?.[0]?.photo_reference;
    if (!photoRef) { photoCache[cacheKey] = null; return null; }

    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${GOOGLE_PLACES_KEY}`;
    photoCache[cacheKey] = photoUrl;
    return photoUrl;
  } catch {
    photoCache[cacheKey] = null;
    return null;
  }
}

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

function JobCard({ job, onApply, applying, isWorker, navigate }: {
  job: any; onApply: () => void; applying: boolean; isWorker: boolean; navigate: any;
}) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(true);

  useEffect(() => {
    if (job.restaurantName && job.location) {
      fetchPlacePhoto(job.restaurantName, job.location).then(url => {
        setPhotoUrl(url);
        setPhotoLoading(false);
      });
    } else {
      setPhotoLoading(false);
    }
  }, [job.restaurantName, job.location]);

  const hours = calcHours(job.startTime, job.endTime);
  const workerPay = calcPay(job.payRate, job.startTime, job.endTime);

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Photo banner */}
      <div className="relative h-36 overflow-hidden">
        {photoLoading ? (
          <div className="w-full h-full bg-secondary animate-pulse" />
        ) : photoUrl ? (
          <img src={photoUrl} alt={job.restaurantName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, oklch(0.68 0.22 38 / 0.3), oklch(0.60 0.18 250 / 0.2))" }}>
            <span className="text-5xl">{ROLE_EMOJI[job.role] ?? "🍽️"}</span>
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
        {/* Pay badge */}
        <div className="absolute top-3 right-3 bg-[#FF6B00] text-white text-xs font-black px-2.5 py-1 rounded-full">
          ${job.payRate}/hr
        </div>
        {/* Restaurant name on photo */}
        {job.restaurantName && (
          <div className="absolute bottom-3 left-3">
            <p className="text-white font-black text-sm drop-shadow-lg">{job.restaurantName}</p>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{ROLE_EMOJI[job.role] ?? "💼"}</span>
            <div>
              <p className="font-black text-sm text-foreground">{ROLE_LABELS[job.role] ?? job.role}</p>
              <p className="text-xs text-muted-foreground">~${workerPay} total · {hours}h</p>
            </div>
          </div>
          {job.minRating && job.minRating > 1 && (
            <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-1 rounded-full">
              <Star size={10} className="text-yellow-400" />
              <span className="text-[10px] text-yellow-400 font-bold">{job.minRating}+</span>
            </div>
          )}
        </div>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock size={11} className="text-primary/70 flex-shrink-0" />
            <span>{formatDate(job.startTime)} · {formatTime(job.startTime)} – {formatTime(job.endTime)}</span>
          </div>
          {job.location && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin size={11} className="text-primary/70 flex-shrink-0" />
              <span className="truncate">{job.location}</span>
            </div>
          )}
        </div>

        {isWorker ? (
          <button
            onClick={onApply}
            disabled={applying}
            className="w-full h-11 bg-primary text-primary-foreground font-black text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {applying
              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <><Zap size={14} strokeWidth={2.5} /> Apply Now</>}
          </button>
        ) : (
          <button onClick={() => navigate("/")} className="w-full h-11 bg-secondary text-foreground font-bold text-sm rounded-xl">
            Sign in to apply →
          </button>
        )}
      </div>
    </div>
  );
}

export default function JobFeed() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [city, setCity] = useState("Austin, TX");

  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const { data: jobs } = trpc.jobs.list.useQuery({ city }, { refetchInterval: 60000 });

  const applyMutation = trpc.applications.applyToJob.useMutation({
    onSuccess: () => toast.success("Application sent!"),
    onError: (e) => toast.error(e.message),
  });

  const isWorker = !profile?.userType || profile.userType === "worker";

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
            <span className="text-primary font-bold">{jobs?.length ?? 0}</span> open shifts in {CITIES[city].label}
          </p>
        </div>

        {/* Feed */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-3 space-y-4 max-w-lg mx-auto pb-6">
            {!jobs ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden animate-pulse">
                    <div className="h-36 bg-secondary" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-secondary rounded w-1/2" />
                      <div className="h-3 bg-secondary rounded w-2/3" />
                      <div className="h-11 bg-secondary rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <ChefHat size={40} className="text-muted-foreground/20 mb-4" />
                <p className="font-bold text-foreground mb-1">No open shifts</p>
                <p className="text-sm text-muted-foreground">Check another city or come back soon</p>
              </div>
            ) : (
              jobs.map((job: any) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onApply={() => applyMutation.mutate({ jobId: job.id })}
                  applying={applyMutation.isPending}
                  isWorker={isWorker}
                  navigate={navigate}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}