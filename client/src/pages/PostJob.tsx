import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppShell from "@/components/AppShell";
import { useLocation } from "wouter";
import { useState } from "react";
import { ArrowLeft, Check, Zap, Crown, Package } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "cook", label: "Cook" },
  { value: "sous_chef", label: "Sous Chef" },
  { value: "prep", label: "Prep Cook" },
  { value: "dishwasher", label: "Dishwasher" },
  { value: "cleaner", label: "Cleaner" },
  { value: "server", label: "Server" },
  { value: "bartender", label: "Bartender" },
  { value: "host", label: "Host" },
  { value: "manager", label: "Manager" },
] as const;

const CITIES = ["Austin, TX", "Houston, TX", "Dallas, TX", "San Antonio, TX", "New York, NY"];

type Step = "pricing" | "form";

export default function PostJob() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("pricing");

  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const utils = trpc.useUtils();

  const purchaseMutation = trpc.payments.purchaseCredits.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.creditsAdded} post credit(s) added!`);
      utils.profile.get.invalidate();
      setStep("form");
    },
    onError: (e) => toast.error(e.message),
  });

  const createJobMutation = trpc.jobs.create.useMutation({
    onSuccess: () => {
      toast.success("Job posted! It's now live in the feed.");
      utils.jobs.myJobs.invalidate();
      navigate("/applications");
    },
    onError: (e) => toast.error(e.message),
  });

  const hasCredits = (profile?.postsRemaining ?? 0) > 0 || profile?.subscriptionStatus === "active";

  // Form state
  const [role, setRole] = useState<string>("server");
  const [payRate, setPayRate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [city, setCity] = useState("Austin, TX");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [minRating, setMinRating] = useState("0");
  const [isPermanent, setIsPermanent] = useState(false);
  const [restaurantName, setRestaurantName] = useState("");

  const handleSubmit = () => {
    if (!payRate || !startDate || !startTime || !endTime || !location) {
      toast.error("Please fill in all required fields");
      return;
    }

    const startMs = new Date(`${startDate}T${startTime}`).getTime();
    const endMs = new Date(`${startDate}T${endTime}`).getTime();

    if (isNaN(startMs) || isNaN(endMs)) {
      toast.error("Invalid date/time");
      return;
    }
    if (endMs <= startMs) {
      toast.error("End time must be after start time");
      return;
    }

    createJobMutation.mutate({
      role: role as any,
      payRate: parseFloat(payRate),
      startTime: startMs,
      endTime: endMs,
      city,
      location,
      description: description || undefined,
      minRating: parseFloat(minRating),
      isPermanent,
      restaurantName: restaurantName || undefined,
    });
  };

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => step === "form" ? setStep("pricing") : navigate("/feed")}
            className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-black">Post a Shift</h1>
            <p className="text-xs text-muted-foreground">
              {step === "pricing" ? "Choose a plan" : "Fill in shift details"}
            </p>
          </div>
        </div>

        {/* Step: Pricing */}
        {step === "pricing" && (
          <div className="space-y-4">
            {/* Current credits */}
            {hasCredits && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-center gap-3">
                <Check size={20} className="text-green-400" />
                <div>
                  <p className="font-bold text-sm text-green-400">You have posting credits</p>
                  <p className="text-xs text-muted-foreground">
                    {profile?.subscriptionStatus === "active"
                      ? "Unlimited posts (subscription active)"
                      : `${profile?.postsRemaining} post(s) remaining`}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="ml-auto"
                  onClick={() => setStep("form")}
                >
                  Continue
                </Button>
              </div>
            )}

            <h2 className="font-bold text-lg">Choose a Plan</h2>

            {/* Pricing cards */}
            <PricingCard
              icon={<Zap size={20} />}
              title="Single Post"
              price="$35"
              desc="Post one shift to the live feed"
              features={["1 job post", "24-hour visibility", "Applicant management"]}
              onClick={() => purchaseMutation.mutate({ tier: "single" })}
              loading={purchaseMutation.isPending}
            />

            <PricingCard
              icon={<Package size={20} />}
              title="3-Post Bundle"
              price="$75"
              desc="Best value for occasional hiring"
              features={["3 job posts", "Save $30 vs single", "30-day validity"]}
              highlighted
              onClick={() => purchaseMutation.mutate({ tier: "bundle3" })}
              loading={purchaseMutation.isPending}
            />

            <PricingCard
              icon={<Crown size={20} />}
              title="Monthly Unlimited"
              price="$99/mo"
              desc="For restaurants that hire regularly"
              features={["Unlimited posts", "Priority in feed", "Analytics & insights"]}
              onClick={() => purchaseMutation.mutate({ tier: "subscription" })}
              loading={purchaseMutation.isPending}
            />
          </div>
        )}

        {/* Step: Form */}
        {step === "form" && (
          <div className="space-y-4">
            {/* Role */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Role Needed *</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={cn(
                      "py-2 px-3 rounded-xl text-sm font-medium transition-colors border",
                      role === r.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Restaurant name */}
            <FormField label="Restaurant / Venue Name">
              <input
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="e.g. The Capital Grille"
                className="input-field"
              />
            </FormField>

            {/* Pay rate */}
            <FormField label="Pay Rate ($/hr) *">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <input
                  type="number"
                  value={payRate}
                  onChange={(e) => setPayRate(e.target.value)}
                  placeholder="18.00"
                  min="7.25"
                  step="0.25"
                  className="input-field pl-7"
                />
              </div>
            </FormField>

            {/* Date */}
            <FormField label="Shift Date *">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="input-field"
              />
            </FormField>

            {/* Times */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Start Time *">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input-field"
                />
              </FormField>
              <FormField label="End Time *">
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="input-field"
                />
              </FormField>
            </div>

            {/* City */}
            <FormField label="City *">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="input-field"
              >
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>

            {/* Location */}
            <FormField label="Address / Location *">
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="123 Main St, Austin, TX"
                className="input-field"
              />
            </FormField>

            {/* Min rating */}
            <FormField label="Minimum Worker Rating">
              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="input-field"
              >
                <option value="0">No minimum</option>
                <option value="3">3★ or higher</option>
                <option value="3.5">3.5★ or higher</option>
                <option value="4">4★ or higher</option>
                <option value="4.5">4.5★ or higher</option>
              </select>
            </FormField>

            {/* Description */}
            <FormField label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the shift, requirements, dress code, etc."
                className="input-field h-24 resize-none"
                maxLength={2000}
              />
            </FormField>

            {/* Permanent toggle */}
            <div className="flex items-center justify-between bg-card rounded-2xl p-4 border border-border">
              <div>
                <p className="font-semibold text-sm">Permanent Potential</p>
                <p className="text-xs text-muted-foreground">Could this become a full-time role?</p>
              </div>
              <button
                onClick={() => setIsPermanent(!isPermanent)}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative",
                  isPermanent ? "bg-green-500" : "bg-secondary"
                )}
              >
                <span className={cn(
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                  isPermanent ? "translate-x-6" : "translate-x-0.5"
                )} />
              </button>
            </div>

            {/* Pay preview */}
            {payRate && startDate && startTime && endTime && (
              <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4">
                <p className="text-sm font-semibold text-primary mb-1">Pay Preview</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total shift pay</span>
                  <span className="font-bold">
                    ${(parseFloat(payRate) * ((new Date(`${startDate}T${endTime}`).getTime() - new Date(`${startDate}T${startTime}`).getTime()) / 3600000)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Worker receives (90%)</span>
                  <span className="font-bold text-green-400">
                    ${(parseFloat(payRate) * ((new Date(`${startDate}T${endTime}`).getTime() - new Date(`${startDate}T${startTime}`).getTime()) / 3600000) * 0.9).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <Button
              size="lg"
              className="w-full h-14 text-base font-bold rounded-2xl"
              disabled={createJobMutation.isPending}
              onClick={handleSubmit}
            >
              {createJobMutation.isPending ? "Posting..." : "Post Shift Now"}
            </Button>
          </div>
        )}
      </div>

      <style>{`
        .input-field {
          width: 100%;
          background: var(--color-secondary);
          border: 1px solid var(--color-border);
          border-radius: 0.75rem;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          color: var(--color-foreground);
          outline: none;
          transition: border-color 0.15s;
        }
        .input-field:focus {
          border-color: var(--color-ring);
        }
        .input-field::placeholder {
          color: var(--color-muted-foreground);
        }
        select.input-field option {
          background: var(--color-popover);
        }
      `}</style>
    </AppShell>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-semibold mb-1.5 block text-foreground">{label}</label>
      {children}
    </div>
  );
}

function PricingCard({
  icon, title, price, desc, features, highlighted, onClick, loading
}: {
  icon: React.ReactNode;
  title: string;
  price: string;
  desc: string;
  features: string[];
  highlighted?: boolean;
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <div className={cn(
      "rounded-2xl border p-4",
      highlighted ? "border-primary bg-primary/5" : "border-border bg-card"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("p-2 rounded-xl", highlighted ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
            {icon}
          </div>
          <div>
            <p className="font-bold">{title}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
        <p className="text-xl font-black text-primary">{price}</p>
      </div>
      <ul className="space-y-1 mb-4">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check size={12} className="text-green-400 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <Button
        className={cn("w-full", highlighted ? "" : "variant-outline")}
        variant={highlighted ? "default" : "outline"}
        onClick={onClick}
        disabled={loading}
      >
        {loading ? "Processing..." : `Get ${title}`}
      </Button>
    </div>
  );
}
