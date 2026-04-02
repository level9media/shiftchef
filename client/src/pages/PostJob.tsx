import { useAuth } from "@/_core/hooks/useAuth";
import { SEOHead } from "@/components/SEOHead";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import AppShell from "@/components/AppShell";
import { useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Check, Zap, Crown, Package, MapPin } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

const MAPBOX_TOKEN = "pk.eyJ1Ijoic2hpZnRjaGVmIiwiYSI6ImNtbmgwcHFjczBmOXMycHEwYjBtMnRzZG8ifQ.kc9hWsTXbrzZej2fIo1b5g";

const ROLE_KEYS = [
  { value: "cook", key: "cook" as const, emoji: "👨‍🍳" },
  { value: "sous_chef", key: "sous_chef" as const, emoji: "🍴" },
  { value: "prep", key: "prep" as const, emoji: "🥗" },
  { value: "dishwasher", key: "dishwasher" as const, emoji: "🫧" },
  { value: "cleaner", key: "cleaner" as const, emoji: "🧹" },
  { value: "server", key: "server" as const, emoji: "🍽️" },
  { value: "bartender", key: "bartender" as const, emoji: "🍸" },
  { value: "host", key: "host" as const, emoji: "🤝" },
  { value: "manager", key: "manager" as const, emoji: "📋" },
] as const;

const CITIES = ["Austin, TX", "Phoenix, AZ", "Mesa, AZ", "Houston, TX", "Dallas, TX", "San Antonio, TX", "New York, NY", "Chicago, IL"];

type Step = "pricing" | "form";

// ─── Mapbox geocoder loader ───────────────────────────────────────────────────
let geocoderLoaded = false;
let geocoderLoading = false;
const geocoderCallbacks: (() => void)[] = [];

function loadGeocoder(cb: () => void) {
  if (geocoderLoaded) { cb(); return; }
  geocoderCallbacks.push(cb);
  if (geocoderLoading) return;
  geocoderLoading = true;

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css";
  document.head.appendChild(css);

  const script = document.createElement("script");
  script.src = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js";
  script.onload = () => {
    geocoderLoaded = true;
    geocoderCallbacks.forEach(fn => fn());
    geocoderCallbacks.length = 0;
  };
  document.head.appendChild(script);
}

// ─── Address Autocomplete ─────────────────────────────────────────────────────
function AddressAutocomplete({ value, onChange, onSelect, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (address: string, lat: number, lng: number) => void;
  placeholder: string;
}) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<any>(null);

  const search = async (query: string) => {
    if (query.length < 3) { setSuggestions([]); return; }
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&types=address,poi&country=us&limit=5`
      );
      const data = await res.json();
      setSuggestions(data.features ?? []);
      setShowSuggestions(true);
    } catch {}
  };

  const handleInput = (v: string) => {
    onChange(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 300);
  };

  const handlePick = (feature: any) => {
    const [lng, lat] = feature.center;
    onChange(feature.place_name);
    onSelect(feature.place_name, lat, lng);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/70" />
        <input
          value={value}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={placeholder}
          className="sc-input pl-8"
        />
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border rounded-xl overflow-hidden shadow-xl">
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={() => handlePick(s)}
              className="w-full text-left px-3 py-2.5 text-xs text-foreground hover:bg-secondary transition-colors border-b border-border last:border-0"
            >
              <span className="font-bold">{s.text}</span>
              <span className="text-muted-foreground ml-1">{s.place_name.replace(s.text, "").replace(/^,\s*/, "")}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PostJob() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("pricing");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const { t, isSpanish } = useLanguage();

  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const utils = trpc.useUtils();

  const redeemCouponMutation = trpc.coupons.redeem.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setCouponApplied(true);
      utils.profile.get.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const purchaseMutation = trpc.payments.purchaseCredits.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (e) => toast.error(e.message),
  });

  const createJobMutation = trpc.jobs.create.useMutation({
    onSuccess: () => {
      toast.success(t("shiftIsLive"));
      utils.jobs.myJobs.invalidate();
      navigate("/applications");
    },
    onError: (e) => toast.error(e.message),
  });

  const hasCredits = (profile?.postsRemaining ?? 0) > 0 || profile?.subscriptionStatus === "active";

  const [role, setRole] = useState<string>("server");
  const [payRate, setPayRate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [city, setCity] = useState("Austin, TX");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [description, setDescription] = useState("");
  const [minRating, setMinRating] = useState("0");
  const [isPermanent, setIsPermanent] = useState(false);
  const [restaurantName, setRestaurantName] = useState("");

  const getPayPreview = () => {
    if (!payRate || !startDate || !startTime || !endTime) return null;
    const startMs = new Date(`${startDate}T${startTime}`).getTime();
    const endMs = new Date(`${startDate}T${endTime}`).getTime();
    if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) return null;
    const hours = (endMs - startMs) / 3600000;
    const total = parseFloat(payRate) * hours;
    return { hours: hours.toFixed(1), total: total.toFixed(2), worker: (total * 0.9).toFixed(2) };
  };

  const handleSubmit = () => {
    if (!payRate || !startDate || !startTime || !endTime || !location) {
      toast.error(t("fillAllFields"));
      return;
    }
    const startMs = new Date(`${startDate}T${startTime}`).getTime();
    const endMs = new Date(`${startDate}T${endTime}`).getTime();
    if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) {
      toast.error(t("invalidTime"));
      return;
    }
    createJobMutation.mutate({
      role: role as any,
      payRate: parseFloat(payRate),
      startTime: startMs,
      endTime: endMs,
      city,
      location,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
      contactName: contactName || undefined,
      contactPhone: contactPhone || undefined,
      description: description || undefined,
      minRating: parseFloat(minRating),
      isPermanent,
      restaurantName: restaurantName || undefined,
    });
  };

  const preview = getPayPreview();

  return (
    <AppShell>
      <SEOHead title="Post a Shift" description="Post a hospitality shift on ShiftChef. Reach verified Austin cooks, servers, bartenders and kitchen staff fast." canonicalPath="/post-job" />
      <div className="max-w-lg mx-auto px-4 py-4 pb-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => step === "form" ? setStep("pricing") : navigate("/feed")}
            className="w-10 h-10 rounded-2xl bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 className="text-xl font-black text-foreground">{t("postAShift")}</h1>
            <p className="text-xs text-muted-foreground">
              {step === "pricing" ? t("chooseAPlan") : t("fillShiftDetails")}
            </p>
          </div>
        </div>

        {/* ── Step 1: Pricing ───────────────────────────────────────────── */}
        {step === "pricing" && (
          <div className="space-y-3">
            {hasCredits && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Check size={16} className="text-emerald-400" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  {profile?.subscriptionStatus !== "active" && (profile?.postsRemaining ?? 0) === 1 && !profile?.freePostUsed ? (
                    <>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-sm text-emerald-400">{t("firstPostFree")}</p>
                        <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">FREE</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{t("firstPostFreeDesc")}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-sm text-emerald-400">{t("creditsAvailable")}</p>
                      <p className="text-xs text-muted-foreground">
                        {profile?.subscriptionStatus === "active"
                          ? t("unlimitedPosts")
                          : `${profile?.postsRemaining} ${t("postsRemaining")}`}
                      </p>
                    </>
                  )}
                </div>
                <Button size="sm" className="flex-shrink-0 rounded-xl" onClick={() => setStep("form")}>
                  {t("continue")}
                </Button>
              </div>
            )}

            {/* Coupon */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{t("couponCode")}</p>
              {couponApplied ? (
                <div className="flex items-center gap-2 text-emerald-400">
                  <Check size={14} strokeWidth={2.5} />
                  <span className="text-sm font-bold">{t("couponApplied")}</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder={t("couponPlaceholder")}
                    className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                    maxLength={20}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl px-4 flex-shrink-0"
                    disabled={!couponCode.trim() || redeemCouponMutation.isPending}
                    onClick={() => redeemCouponMutation.mutate({ code: couponCode.trim() })}
                  >
                    {redeemCouponMutation.isPending ? "..." : t("applyCoupon")}
                  </Button>
                </div>
              )}
            </div>

            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider pt-1">{t("choosePlan")}</p>

            <PricingCard
              icon={<Zap size={18} />}
              title={t("singlePost")}
              price="$35"
              desc={t("singlePostDesc")}
              features={isSpanish ? ["1 publicación", "En vivo al instante", "Gestión de solicitantes"] : ["1 job post", "Instant live feed listing", "Applicant management"]}
              onClick={() => purchaseMutation.mutate({ tier: "single", origin: window.location.origin })}
              loading={purchaseMutation.isPending}
              isSpanish={isSpanish}
            />
            <PricingCard
              icon={<Package size={18} />}
              title={t("bundlePost")}
              price="$75"
              desc={t("bundlePostDesc")}
              features={isSpanish ? ["3 publicaciones", "Ahorra $30 vs individual", "Válido 30 días"] : ["3 job posts", "Save $30 vs single", "30-day validity"]}
              highlighted
              onClick={() => purchaseMutation.mutate({ tier: "bundle3", origin: window.location.origin })}
              loading={purchaseMutation.isPending}
              isSpanish={isSpanish}
            />
            <PricingCard
              icon={<Crown size={18} />}
              title={t("monthlyUnlimited")}
              price="$99/mo"
              desc={t("monthlyUnlimitedDesc")}
              features={isSpanish ? ["Publicaciones ilimitadas", "Prioridad en el feed", "Analíticas e insights"] : ["Unlimited posts", "Priority in feed", "Analytics & insights"]}
              onClick={() => purchaseMutation.mutate({ tier: "subscription", origin: window.location.origin })}
              loading={purchaseMutation.isPending}
              isSpanish={isSpanish}
            />
          </div>
        )}

        {/* ── Step 2: Form ──────────────────────────────────────────────── */}
        {step === "form" && (
          <div className="space-y-4">
            {/* Role picker */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("roleNeeded")} *</p>
              <div className="grid grid-cols-3 gap-2">
                {ROLE_KEYS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={cn(
                      "py-2.5 px-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center gap-1",
                      role === r.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                    )}
                  >
                    <span className="text-base">{r.emoji}</span>
                    {t(r.key)}
                  </button>
                ))}
              </div>
            </div>

            {/* Venue name */}
            <FormField label={t("restaurantNameLabel")}>
              <input value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} placeholder={t("restaurantNamePlaceholder")} className="sc-input" />
            </FormField>

            {/* Pay rate */}
            <FormField label={`${t("hourlyRate")} *`}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input type="number" value={payRate} onChange={(e) => setPayRate(e.target.value)} placeholder="18.00" min="7.25" step="0.25" className="sc-input pl-7" />
              </div>
            </FormField>

            {/* Date */}
            <FormField label={`${t("startDate")} *`}>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="sc-input" />
            </FormField>

            {/* Times */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label={`${t("startTime")} *`}>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="sc-input" />
              </FormField>
              <FormField label={`${t("endTime")} *`}>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="sc-input" />
              </FormField>
            </div>

            {/* City */}
            <FormField label={`${t("city")} *`}>
              <select value={city} onChange={(e) => setCity(e.target.value)} className="sc-input">
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>

            {/* Address with autocomplete */}
            <FormField label={`${t("locationLabel")} *`}>
              <AddressAutocomplete
                value={location}
                onChange={(v) => {
                  setLocation(v);
                  // Clear coords if they manually edit after picking
                  setLatitude(null);
                  setLongitude(null);
                }}
                onSelect={(address, lat, lng) => {
                  setLocation(address);
                  setLatitude(lat);
                  setLongitude(lng);
                }}
                placeholder={t("locationPlaceholder")}
              />
              {latitude && longitude && (
                <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                  <Check size={10} strokeWidth={2.5} /> Location pinned on map
                </p>
              )}
            </FormField>

            {/* Contact info */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Contact name">
                <input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Manager name"
                  className="sc-input"
                />
              </FormField>
              <FormField label="Contact phone">
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="(512) 555-0100"
                  className="sc-input"
                />
              </FormField>
            </div>

            {/* Min rating */}
            <FormField label={t("minimumRating")}>
              <select value={minRating} onChange={(e) => setMinRating(e.target.value)} className="sc-input">
                <option value="0">{t("noRatingReq")}</option>
                <option value="3">3★ {isSpanish ? "o más" : "or higher"}</option>
                <option value="3.5">3.5★ {isSpanish ? "o más" : "or higher"}</option>
                <option value="4">4★ {isSpanish ? "o más" : "or higher"}</option>
                <option value="4.5">4.5★ {isSpanish ? "o más" : "or higher"}</option>
              </select>
            </FormField>

            {/* Description */}
            <FormField label={t("jobDescription")}>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("descriptionPlaceholder")} className="sc-input h-24 resize-none" maxLength={2000} />
            </FormField>

            {/* Permanent toggle */}
            <div className="flex items-center justify-between bg-card rounded-2xl p-4 border border-border">
              <div>
                <p className="font-bold text-sm text-foreground">{t("permanentOpportunity")}</p>
                <p className="text-xs text-muted-foreground">{t("permanentDesc")}</p>
              </div>
              <button
                onClick={() => setIsPermanent(!isPermanent)}
                className={cn("w-12 h-6 rounded-full transition-colors relative flex-shrink-0", isPermanent ? "bg-emerald-500" : "bg-secondary border border-border")}
              >
                <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform", isPermanent ? "translate-x-6" : "translate-x-0.5")} />
              </button>
            </div>

            {/* Pay preview */}
            {preview && (
              <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">{t("payPreview")}</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{preview.hours}h × ${payRate}/hr</span>
                    <span className="font-bold text-foreground">${preview.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("workerReceives")} (90%)</span>
                    <span className="font-bold text-emerald-400">${preview.worker}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isSpanish ? "Comisión plataforma (10%)" : "Platform fee (10%)"}</span>
                    <span className="text-muted-foreground">${(parseFloat(preview.total) * 0.1).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <Button
              size="lg"
              className="w-full h-14 text-base font-bold rounded-2xl btn-glow"
              disabled={createJobMutation.isPending}
              onClick={handleSubmit}
            >
              {createJobMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                isSpanish ? "Publicar Turno Ahora" : "Post Shift Now"
              )}
            </Button>
          </div>
        )}
      </div>

      <style>{`
        .sc-input {
          width: 100%;
          background: oklch(0.12 0 0);
          border: 1px solid oklch(0.22 0 0);
          border-radius: 0.75rem;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          color: oklch(0.95 0 0);
          outline: none;
          transition: border-color 0.15s;
        }
        .sc-input:focus { border-color: oklch(0.68 0.22 38); }
        .sc-input::placeholder { color: oklch(0.50 0 0); }
        select.sc-input option { background: oklch(0.10 0 0); }
      `}</style>
    </AppShell>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function PricingCard({
  icon, title, price, desc, features, highlighted, onClick, loading, isSpanish
}: {
  icon: React.ReactNode; title: string; price: string; desc: string;
  features: string[]; highlighted?: boolean; onClick: () => void; loading: boolean; isSpanish: boolean;
}) {
  return (
    <div className={cn(
      "rounded-2xl border p-4 transition-all",
      highlighted ? "border-primary bg-primary/8" : "border-border bg-card"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", highlighted ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
            {icon}
          </div>
          <div>
            <p className="font-black text-sm text-foreground">{title}</p>
            <p className="text-[10px] text-muted-foreground">{desc}</p>
          </div>
        </div>
        <p className="text-xl font-black text-primary flex-shrink-0 ml-2">{price}</p>
      </div>
      <ul className="space-y-1 mb-3">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Check size={10} className="text-emerald-400 flex-shrink-0" strokeWidth={2.5} />
            {f}
          </li>
        ))}
      </ul>
      <Button className="w-full rounded-xl" variant={highlighted ? "default" : "outline"} onClick={onClick} disabled={loading} size="sm">
        {loading ? (isSpanish ? "Procesando..." : "Processing...") : (isSpanish ? `Obtener ${title}` : `Get ${title}`)}
      </Button>
    </div>
  );
}
