import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import AppShell from "@/components/AppShell";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Star, MapPin, Briefcase, Edit2, Check, LogOut, RefreshCw, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SKILLS = [
  { value: "cook", label: "Cook" },
  { value: "sous_chef", label: "Sous Chef" },
  { value: "prep", label: "Prep Cook" },
  { value: "dishwasher", label: "Dishwasher" },
  { value: "cleaner", label: "Cleaner" },
  { value: "server", label: "Server" },
  { value: "bartender", label: "Bartender" },
  { value: "host", label: "Host" },
  { value: "manager", label: "Manager" },
];

const CITIES = ["Austin, TX", "Houston, TX", "Dallas, TX", "San Antonio, TX", "New York, NY"];

export default function Profile() {
  const { isAuthenticated, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState(false);

  const { data: profile, isLoading, refetch } = trpc.profile.get.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

  const updateMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success("Profile updated!");
      setEditing(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const setRoleMutation = trpc.profile.setRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated!");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  // Form state
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("Austin, TX");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setBio(profile.bio ?? "");
      setCity(profile.city ?? "Austin, TX");
      setLocation(profile.location ?? "");
      setExperience(profile.experience ?? "");
      setProfileImage(profile.profileImage ?? "");
      try {
        setSelectedSkills(JSON.parse(profile.skills ?? "[]"));
      } catch {
        setSelectedSkills([]);
      }
    }
  }, [profile]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/");
  }, [isAuthenticated, authLoading]);

  const handleSave = () => {
    updateMutation.mutate({
      name: name || undefined,
      bio: bio || undefined,
      city,
      location: location || undefined,
      experience: experience || undefined,
      skills: selectedSkills,
      profileImage: profileImage || undefined,
    });
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  if (authLoading || isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  const isWorker = !profile?.userType || profile.userType === "worker" || profile.userType === "both";
  const skills: string[] = (() => {
    try { return JSON.parse(profile?.skills ?? "[]"); } catch { return []; }
  })();

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Profile header */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center overflow-hidden border border-border">
                {profile?.profileImage ? (
                  <img src={profile.profileImage} alt={profile.name ?? ""} className="w-full h-full object-cover" />
                ) : (
                  <User size={28} className="text-muted-foreground" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black truncate">{profile?.name ?? "Your Name"}</h2>
              <p className="text-muted-foreground text-sm">{profile?.email}</p>

              <div className="flex items-center gap-3 mt-2">
                {/* Rating */}
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-bold">{(profile?.rating ?? 5).toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({profile?.totalRatings ?? 0})</span>
                </div>

                {/* Reliability */}
                {isWorker && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">Reliability:</span>
                    <span className="text-xs font-bold text-green-400">{(profile?.reliabilityScore ?? 100).toFixed(0)}%</span>
                  </div>
                )}
              </div>

              {profile?.city && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin size={10} />
                  {profile.city}
                </p>
              )}
            </div>

            <button
              onClick={() => setEditing(!editing)}
              className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground"
            >
              {editing ? <Check size={16} /> : <Edit2 size={16} />}
            </button>
          </div>

          {/* Skills badges */}
          {!editing && skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {skills.map((s) => (
                <span key={s} className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                  {SKILLS.find((sk) => sk.value === s)?.label ?? s}
                </span>
              ))}
            </div>
          )}

          {!editing && profile?.bio && (
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{profile.bio}</p>
          )}
        </div>

        {/* Edit form */}
        {editing && (
          <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
            <h3 className="font-bold">Edit Profile</h3>

            <FormField label="Display Name">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="input-field" />
            </FormField>

            <FormField label="Profile Image URL">
              <input value={profileImage} onChange={(e) => setProfileImage(e.target.value)} placeholder="https://..." className="input-field" />
            </FormField>

            <FormField label="Bio">
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell employers about yourself..." className="input-field h-20 resize-none" maxLength={500} />
            </FormField>

            <FormField label="City">
              <select value={city} onChange={(e) => setCity(e.target.value)} className="input-field">
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>

            <FormField label="Address / Neighborhood">
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="East Austin, TX" className="input-field" />
            </FormField>

            {isWorker && (
              <>
                <FormField label="Experience">
                  <textarea value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="5 years fine dining, 3 years bar..." className="input-field h-20 resize-none" maxLength={1000} />
                </FormField>

                <div>
                  <label className="text-sm font-semibold mb-2 block">Skills / Roles</label>
                  <div className="grid grid-cols-3 gap-2">
                    {SKILLS.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => toggleSkill(s.value)}
                        className={cn(
                          "py-2 px-2 rounded-xl text-xs font-medium transition-colors border",
                          selectedSkills.includes(s.value)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary text-muted-foreground border-border"
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Button
              className="w-full"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}

        {/* Role switcher */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Briefcase size={16} className="text-primary" />
            Account Type
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {(["worker", "employer", "both"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setRoleMutation.mutate({ userType: type })}
                className={cn(
                  "py-2 px-3 rounded-xl text-xs font-semibold transition-colors border capitalize",
                  profile?.userType === type
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-muted-foreground border-border"
                )}
              >
                {type}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Switch between worker and employer modes at any time
          </p>
        </div>

        {/* Stripe Connect (workers) */}
        {isWorker && (
          <StripeConnectCard profile={profile} />
        )}

        {/* Employer subscription status */}
        {(profile?.userType === "employer" || profile?.userType === "both") && (
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="font-bold mb-2">Posting Credits</h3>
            <p className="text-sm text-muted-foreground">
              {profile?.subscriptionStatus === "active"
                ? "✅ Unlimited posts (subscription active)"
                : `${profile?.postsRemaining ?? 0} post(s) remaining`}
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/post-job")}>
              Get More Credits
            </Button>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors text-sm font-medium"
        >
          <LogOut size={16} />
          Sign Out
        </button>
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
        .input-field:focus { border-color: var(--color-ring); }
        .input-field::placeholder { color: var(--color-muted-foreground); }
        select.input-field option { background: var(--color-popover); }
      `}</style>
    </AppShell>
  );
}

function StripeConnectCard({ profile }: { profile: any }) {
  const utils = trpc.useUtils();
  const connectMutation = trpc.payments.connectStripe.useMutation({
    onSuccess: () => {
      toast.success("Stripe account connected!");
      utils.profile.get.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <h3 className="font-bold mb-2">Payment Account</h3>
      {profile?.stripeOnboardingComplete ? (
        <div className="flex items-center gap-2 text-green-400">
          <Check size={16} />
          <span className="text-sm font-medium">Stripe account connected</span>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-3">
            Connect your Stripe account to receive payments after shifts.
          </p>
          <Button
            className="w-full"
            onClick={() => connectMutation.mutate()}
            disabled={connectMutation.isPending}
          >
            {connectMutation.isPending ? "Connecting..." : "Connect Stripe Account"}
          </Button>
        </>
      )}
    </div>
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
