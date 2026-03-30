import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import {
  Star, MapPin, Briefcase, ChefHat, LogOut,
  Edit3, Check, X, Shield, ChevronRight, Camera,
  ShieldCheck, FileText, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

const CITIES = ["Austin, TX", "Phoenix, AZ", "Mesa, AZ", "Houston, TX", "Dallas, TX", "San Antonio, TX", "New York, NY"];

export default function Profile() {
  const { isAuthenticated, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState(false);

  const { data: profile, isLoading, refetch } = trpc.profile.get.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

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
      try { setSelectedSkills(JSON.parse(profile.skills ?? "[]")); } catch { setSelectedSkills([]); }
    }
  }, [profile]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/");
  }, [isAuthenticated, authLoading]);

  const updateMutation = trpc.profile.update.useMutation({
    onSuccess: () => { toast.success("Profile saved!"); setEditing(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const setRoleMutation = trpc.profile.setRole.useMutation({
    onSuccess: () => { toast.success("Role updated!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

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

  const isWorker = !profile?.userType || profile?.userType === "worker" || profile?.userType === "both";
  const isEmployer = profile?.userType === "employer" || profile?.userType === "both";
  const skills: string[] = (() => {
    try { return JSON.parse(profile?.skills ?? "[]"); } catch { return []; }
  })();
  const rating = profile?.rating ? parseFloat(String(profile.rating)) : null;
  const reliability = profile?.reliabilityScore ? parseFloat(String(profile.reliabilityScore)) : null;

  return (
    <AppShell>
      <div className="max-w-lg mx-auto">
        {/* ── Hero banner ───────────────────────────────────────────────── */}
        <div className="relative">
          <div
            className="h-28"
            style={{ background: "linear-gradient(135deg, oklch(0.68 0.22 38 / 0.25), oklch(0.60 0.18 250 / 0.15))" }}
          />
          {/* Avatar */}
          <div className="absolute bottom-0 left-4 translate-y-1/2">
            <div className="relative">
              {profile?.profileImage ? (
                <img src={profile.profileImage} alt="" className="w-20 h-20 rounded-3xl object-cover border-4 border-background" />
              ) : (
                <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center border-4 border-background">
                  <ChefHat size={30} className="text-primary-foreground" />
                </div>
              )}
            </div>
          </div>
          {/* Edit button */}
          <div className="absolute bottom-0 right-4 translate-y-1/2 flex gap-2">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center">
                  <X size={14} className="text-muted-foreground" />
                </button>
                <button onClick={handleSave} disabled={updateMutation.isPending} className="h-9 px-4 rounded-xl bg-primary flex items-center gap-1.5 text-primary-foreground text-xs font-bold">
                  <Check size={13} strokeWidth={2.5} />Save
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="h-9 px-4 rounded-xl bg-secondary border border-border flex items-center gap-1.5 text-foreground text-xs font-bold">
                <Edit3 size={13} />Edit
              </button>
            )}
          </div>
        </div>

        {/* ── Name & badges ─────────────────────────────────────────────── */}
        <div className="mt-14 px-4 pb-2">
          {editing ? (
            <Input value={name} onChange={(e) => setName(e.target.value)} className="text-xl font-black bg-transparent border-0 border-b border-border rounded-none px-0 h-auto focus-visible:ring-0 text-foreground" placeholder="Your name" />
          ) : (
            <h2 className="text-2xl font-black text-foreground">{profile?.name ?? "Your Name"}</h2>
          )}

          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary px-2.5 py-1 rounded-full border border-border">
              {profile?.userType ?? "worker"}
            </span>
            {rating !== null && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-full">
                <Star size={10} strokeWidth={2.5} />{rating.toFixed(1)} rating
              </span>
            )}
            {reliability !== null && isWorker && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">
                <Shield size={10} strokeWidth={2.5} />{reliability.toFixed(0)}% reliable
              </span>
            )}
            {isWorker && (profile as any)?.verificationStatus === "verified" && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded-full">
                <ShieldCheck size={10} strokeWidth={2.5} />ID Verified
              </span>
            )}
          </div>

          {!editing && profile?.bio && (
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{profile.bio}</p>
          )}
        </div>

        {/* ── Stats row ─────────────────────────────────────────────────── */}
        {isWorker && (
          <div className="px-4 mt-4 grid grid-cols-3 gap-2">
            <StatCard label="Rating" value={rating ? `${rating.toFixed(1)}★` : "—"} color="text-yellow-400" />
            <StatCard label="Reliable" value={reliability ? `${reliability.toFixed(0)}%` : "—"} color="text-emerald-400" />
            <StatCard label="Shifts" value={String((profile as any)?.totalShifts ?? 0)} color="text-primary" />
          </div>
        )}

        {/* ── Edit form ─────────────────────────────────────────────────── */}
        {editing && (
          <div className="px-4 mt-4 space-y-3">
            <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Profile Image URL</p>
              <Input value={profileImage} onChange={(e) => setProfileImage(e.target.value)} placeholder="https://..." className="bg-secondary border-border text-sm h-9" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">Bio</p>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary" rows={3} placeholder="Tell employers about yourself..." />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">City</p>
              <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">Neighborhood</p>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="East Austin, TX" className="bg-secondary border-border text-sm h-9" />
            </div>

            {isWorker && (
              <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Experience</p>
                <textarea value={experience} onChange={(e) => setExperience(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary" rows={3} placeholder="5 years fine dining, 3 years bar..." />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">Skills & Roles</p>
                <div className="flex flex-wrap gap-2">
                  {SKILLS.map((s) => (
                    <button key={s.value} onClick={() => toggleSkill(s.value)}
                      className={cn("px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                        selectedSkills.includes(s.value) ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground border border-border"
                      )}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Skills display (view mode) ─────────────────────────────────── */}
        {!editing && skills.length > 0 && (
          <div className="px-4 mt-4">
            <div className="bg-card rounded-2xl border border-border p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Skills & Roles</p>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span key={s} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/30">
                    {SKILLS.find((sk) => sk.value === s)?.label ?? s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Location ──────────────────────────────────────────────────── */}
        {!editing && (profile?.location || profile?.city) && (
          <div className="px-4 mt-3">
            <div className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-muted-foreground" />
                <span className="text-sm text-foreground">{profile?.location ?? profile?.city}</span>
              </div>
            </div>
          </div>
        )}

          {/* ── Recent Reviews ───────────────────────────────────────── */}
        {profile?.id && <RecentReviews userId={profile.id} onViewAll={() => navigate("/ratings")} />}

        {/* ── Account type ───────────────────────────────────────────── */}
        <div className="px-4 mt-3">
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-4 pt-4 pb-2">Switch Role</p>
            {(["worker", "employer", "both"] as const).map((type) => (
              <button key={type} onClick={() => setRoleMutation.mutate({ userType: type })}
                className={cn("w-full flex items-center justify-between px-4 py-3 border-t border-border transition-colors",
                  profile?.userType === type ? "bg-primary/10" : "hover:bg-secondary"
                )}>
                <span className="text-sm font-medium text-foreground capitalize">
                  {type === "worker" ? "Worker only" : type === "employer" ? "Employer only" : "Both roles"}
                </span>
                {profile?.userType === type
                  ? <Check size={14} className="text-primary" strokeWidth={2.5} />
                  : <ChevronRight size={14} className="text-muted-foreground" />}
              </button>
            ))}
          </div>
        </div>

        {/* ── Employer credits ──────────────────────────────────────────── */}
        {isEmployer && (
          <div className="px-4 mt-3">
            <div className="bg-card rounded-2xl border border-border p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Posting Credits</p>
              <p className="text-sm text-foreground">
                {profile?.subscriptionStatus === "active"
                  ? "✅ Unlimited posts (subscription active)"
                  : `${profile?.postsRemaining ?? 0} post(s) remaining`}
              </p>
              <button onClick={() => navigate("/post-job")} className="mt-3 text-xs font-bold text-primary flex items-center gap-1">
                Buy more credits <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )}

        {/* ── Worker compliance ───────────────────────────────────── */}
        {isWorker && (
          <div className="px-4 mt-3">
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-4 pt-4 pb-2">Worker Compliance</p>
              <button onClick={() => navigate("/verify")}
                className="w-full flex items-center justify-between px-4 py-3 border-t border-border hover:bg-secondary transition-colors">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={16} className={(profile as any)?.verificationStatus === "verified" ? "text-emerald-400" : "text-yellow-400"} />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Identity Verification</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {(profile as any)?.verificationStatus ?? "unverified"}
                    </p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-muted-foreground" />
              </button>
              <button onClick={() => navigate("/contract")}
                className="w-full flex items-center justify-between px-4 py-3 border-t border-border hover:bg-secondary transition-colors">
                <div className="flex items-center gap-3">
                  <FileText size={16} className={(profile as any)?.contractSigned ? "text-emerald-400" : "text-yellow-400"} />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Contractor Agreement (1099)</p>
                    <p className="text-xs text-muted-foreground">
                      {(profile as any)?.contractSigned ? "Signed ✓" : "Not signed — required for payouts"}
                    </p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-muted-foreground" />
              </button>
            </div>
          </div>
        )}
        {/* ── Logout ────────────────────────────────────────────────────── */}
        <div className="px-4 mt-3 pb-6">
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border border-destructive/30 text-destructive text-sm font-semibold hover:bg-destructive/10 transition-colors">
            <LogOut size={15} />Sign Out
          </button>
        </div>
      </div>
    </AppShell>
  );
}

const RATING_LABELS_PROFILE: Record<number, string> = {
  5: "Absolutely", 4: "Sure", 3: "Maybe", 2: "Not really", 1: "Never",
};
const RATING_COLORS_PROFILE: Record<number, string> = {
  5: "text-emerald-400", 4: "text-green-400", 3: "text-yellow-400", 2: "text-orange-400", 1: "text-red-400",
};

function RecentReviews({ userId, onViewAll }: { userId: number; onViewAll: () => void }) {
  const { data: reviews, isLoading } = trpc.ratings.forUser.useQuery(
    { userId },
    { enabled: !!userId }
  );
  const { data: stats } = trpc.ratings.stats.useQuery({ userId }, { enabled: !!userId });

  if (isLoading) return null;
  if (!reviews || reviews.length === 0) return null;

  const recent = reviews.slice(0, 3);

  return (
    <div className="px-4 mt-3">
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <MessageSquare size={13} className="text-muted-foreground" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Reviews</p>
            {stats && stats.total > 0 && (
              <span className="text-xs font-black text-primary">{stats.avg.toFixed(1)}/5 avg</span>
            )}
          </div>
          <button onClick={onViewAll} className="text-xs font-bold text-primary hover:underline">View all</button>
        </div>
        {recent.map((r: any, i: number) => (
          <div key={r.id} className={cn("px-4 py-3", i > 0 ? "border-t border-border" : "border-t border-border")}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-foreground">{r.raterName ?? "User"}</p>
              <p className={cn("text-xs font-black", RATING_COLORS_PROFILE[r.score as number])}>
                {r.score}/5 - {RATING_LABELS_PROFILE[r.score as number]}
              </p>
            </div>
            {r.comment && <p className="text-xs text-muted-foreground italic line-clamp-2">"{r.comment}"</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-3 text-center">
      <p className={cn("text-xl font-black", color)}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
