import { useAuth } from "@/_core/hooks/useAuth";
import { SEOHead } from "@/components/SEOHead";
import { trpc } from "@/lib/trpc";
import AppShell from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Star, MapPin, ChefHat, LogOut,
  Edit3, Check, X, Shield, ChevronRight, Camera,
  ShieldCheck, FileText, MessageSquare, Plus, Trash2, Award, Briefcase, Gift
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

const ROLE_OPTIONS = SKILLS.map((s) => s.label);

const CITIES = [
  "Austin, TX", "Las Vegas, NV", "Phoenix, AZ", "Mesa, AZ", "Houston, TX",
  "Dallas, TX", "San Antonio, TX", "New York, NY",
];

type PastJob = { place: string; role: string };

const GIVEAWAY_END = new Date("2025-07-04T23:59:59");

function GiveawayCard({ userId }: { userId: number }) {
  const [timeLeft, setTimeLeft] = useState("");
  const entryId = String(userId).slice(-4).padStart(4, "0");

  useEffect(() => {
    function update() {
      const now = new Date();
      const diff = GIVEAWAY_END.getTime() - now.getTime();
      if (diff <= 0) { setTimeLeft("ended"); return; }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${days}d ${hours}h ${mins}m`);
    }
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  if (timeLeft === "ended") return null;
  if (new Date() > GIVEAWAY_END) return null;

  return (
    <div className="px-4 mt-3">
      <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Gift size={16} className="text-orange-400" />
          <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">$100 Amazon Gift Card Giveaway</p>
        </div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-white/50 mb-0.5">Your Entry ID</p>
            <p className="text-2xl font-black text-white tracking-widest">#{entryId}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/50 mb-0.5">Ends in</p>
            <p className="text-sm font-bold text-orange-400">{timeLeft}</p>
          </div>
        </div>
        <div className="rounded-xl bg-black/20 border border-white/5 p-3">
          <p className="text-xs text-white/60 leading-relaxed">
            🎉 You're entered! One winner will be selected on <span className="text-white font-semibold">July 4th, 2025</span> and notified by text. Keep your phone on.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { isAuthenticated, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading, refetch } = trpc.profile.get.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("Austin, TX");
  const [location, setLocation] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState("");
  const [yearsExperience, setYearsExperience] = useState(0);
  const [specialty, setSpecialty] = useState("");
  const [pastJobs, setPastJobs] = useState<PastJob[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setBio(profile.bio ?? "");
      setCity(profile.city ?? "Austin, TX");
      setLocation(profile.location ?? "");
      setProfileImage(profile.profileImage ?? "");
      setYearsExperience((profile as any).yearsExperience ?? 0);
      setSpecialty((profile as any).specialty ?? "");
      try { setPastJobs(JSON.parse(profile.experience ?? "[]")); } catch { setPastJobs([]); }
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

  const uploadPhotoMutation = trpc.profile.uploadPhoto.useMutation({
    onSuccess: (data) => {
      setProfileImage(data.url);
      toast.success("Photo uploaded!");
      refetch();
    },
    onError: (e) => toast.error(e.message),
    onSettled: () => setPhotoUploading(false),
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error("Photo must be under 8MB"); return; }
    setPhotoUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const mimeType = (file.type as "image/jpeg" | "image/png" | "image/webp") || "image/jpeg";
      uploadPhotoMutation.mutate({ dataUrl, mimeType });
    };
    reader.readAsDataURL(file);
  };

  const addPastJob = () => setPastJobs((prev) => [...prev, { place: "", role: "" }]);
  const removePastJob = (i: number) => setPastJobs((prev) => prev.filter((_, idx) => idx !== i));
  const updatePastJob = (i: number, field: keyof PastJob, val: string) =>
    setPastJobs((prev) => prev.map((j, idx) => idx === i ? { ...j, [field]: val } : j));

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSave = () => {
    updateMutation.mutate({
      name: name || undefined,
      bio: bio || undefined,
      city,
      location: location || undefined,
      skills: selectedSkills,
      profileImage: profileImage || undefined,
      yearsExperience,
      specialty: specialty || undefined,
      experience: pastJobs.filter((j) => j.place.trim()),
    });
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

  const isWorker = !profile?.userType || profile?.userType === "worker";
  const isEmployer = profile?.userType === "employer";
  const skills: string[] = (() => {
    try { return JSON.parse(profile?.skills ?? "[]"); } catch { return []; }
  })();
  const displayPastJobs: PastJob[] = (() => {
    try { return JSON.parse(profile?.experience ?? "[]"); } catch { return []; }
  })();
  const rating = profile?.rating ? parseFloat(String(profile.rating)) : null;
  const reliability = profile?.reliabilityScore ? parseFloat(String(profile.reliabilityScore)) : null;
  const profileYearsExp = (profile as any)?.yearsExperience ?? 0;
  const profileSpecialty = (profile as any)?.specialty ?? "";

  const { t, isSpanish } = useLanguage();

  return (
    <AppShell>
      <SEOHead title="My Profile" description="Manage your ShiftChef worker or employer profile, skills, ratings, and verification status." canonicalPath="/profile" />
      <div className="max-w-lg mx-auto">
        {/* Hero banner */}
        <div className="relative">
          <div
            className="h-28"
            style={{ background: "linear-gradient(135deg, oklch(0.68 0.22 38 / 0.25), oklch(0.60 0.18 250 / 0.15))" }}
          />
          <div className="absolute bottom-0 left-4 translate-y-1/2">
            <div className="relative">
              {(profileImage || profile?.profileImage) ? (
                <img
                  src={profileImage || profile?.profileImage || ""}
                  alt=""
                  className="w-20 h-20 rounded-3xl object-cover border-4 border-background"
                />
              ) : (
                <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center border-4 border-background">
                  <ChefHat size={30} className="text-primary-foreground" />
                </div>
              )}
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={photoUploading}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary border-2 border-background flex items-center justify-center shadow-md"
              >
                {photoUploading
                  ? <div className="w-3 h-3 border border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  : <Camera size={12} className="text-primary-foreground" />}
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
          </div>
          <div className="absolute bottom-0 right-4 translate-y-1/2 flex gap-2">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center">
                  <X size={14} className="text-muted-foreground" />
                </button>
                <button onClick={handleSave} disabled={updateMutation.isPending} className="h-9 px-4 rounded-xl bg-primary flex items-center gap-1.5 text-primary-foreground text-xs font-bold">
                  <Check size={13} strokeWidth={2.5} />{t("save")}
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="h-9 px-4 rounded-xl bg-secondary border border-border flex items-center gap-1.5 text-foreground text-xs font-bold">
                <Edit3 size={13} />{t("editProfile")}
              </button>
            )}
          </div>
        </div>

        {/* Name & badges */}
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
            {isWorker && profileYearsExp > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-purple-400 bg-purple-400/10 px-2.5 py-1 rounded-full">
                <Award size={10} strokeWidth={2.5} />{profileYearsExp}yr exp
              </span>
            )}
            {isWorker && profileSpecialty && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-400/10 px-2.5 py-1 rounded-full">
                <ChefHat size={10} strokeWidth={2.5} />{profileSpecialty}
              </span>
            )}
          </div>

          {!editing && profile?.bio && (
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{profile.bio}</p>
          )}
        </div>

        {/* Stats row */}
        {isWorker && (
          <div className="px-4 mt-4 grid grid-cols-3 gap-2">
            <StatCard label={isSpanish ? "Calificación" : "Rating"} value={rating ? `${rating.toFixed(1)}★` : "—"} color="text-yellow-400" />
            <StatCard label={isSpanish ? "Confiable" : "Reliable"} value={reliability ? `${reliability.toFixed(0)}%` : "—"} color="text-emerald-400" />
            <StatCard label={isSpanish ? "Años Exp." : "Yrs Exp."} value={profileYearsExp > 0 ? `${profileYearsExp}` : "—"} color="text-purple-400" />
          </div>
        )}

        {/* Giveaway card — workers only */}
        {isWorker && profile?.id && <GiveawayCard userId={profile.id} />}

        {/* Edit form */}
        {editing && (
          <div className="px-4 mt-4 space-y-3">
            <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("bio")}</p>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary" rows={3} placeholder={t("bioPlaceholder")} />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">{isSpanish ? "Ciudad" : "City"}</p>
              <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">{isSpanish ? "Vecindario" : "Neighborhood"}</p>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="East Austin, TX" className="bg-secondary border-border text-sm h-9" />
            </div>

            {isWorker && (
              <>
                <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {isSpanish ? "Experiencia" : "Experience"}
                  </p>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground whitespace-nowrap">
                      {isSpanish ? "Años de experiencia" : "Years of experience"}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(parseInt(e.target.value) || 0)}
                      className="w-20 bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">
                    {isSpanish ? "Especialidad Principal" : "Primary Specialty"}
                  </p>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">{isSpanish ? "Seleccionar especialidad..." : "Select specialty..."}</option>
                    {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {isSpanish ? "Trabajos Anteriores" : "Past Jobs"}
                    </p>
                    <button onClick={addPastJob} className="flex items-center gap-1 text-xs font-bold text-primary">
                      <Plus size={12} />{isSpanish ? "Agregar" : "Add"}
                    </button>
                  </div>
                  {pastJobs.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      {isSpanish ? "Agrega tus trabajos anteriores para que los empleadores puedan verte." : "Add your past jobs so employers can see your experience."}
                    </p>
                  )}
                  {pastJobs.map((job, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-1.5">
                        <Input
                          value={job.place}
                          onChange={(e) => updatePastJob(i, "place", e.target.value)}
                          placeholder={isSpanish ? "Nombre del lugar" : "Place name"}
                          className="bg-secondary border-border text-sm h-9"
                        />
                        <select
                          value={job.role}
                          onChange={(e) => updatePastJob(i, "role", e.target.value)}
                          className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">{isSpanish ? "Seleccionar rol..." : "Select role..."}</option>
                          {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <button onClick={() => removePastJob(i)} className="mt-1 w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                        <Trash2 size={13} className="text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {isSpanish ? "Habilidades y Roles" : "Skills & Roles"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS.map((s) => (
                      <button key={s.value} onClick={() => toggleSkill(s.value)}
                        className={cn("px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                          selectedSkills.includes(s.value)
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground border border-border"
                        )}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Skills display (view mode) */}
        {!editing && (skills.length > 0 || displayPastJobs.length > 0 || profileYearsExp > 0) && (
          <div className="px-4 mt-4 space-y-3">
            {isWorker && (profileYearsExp > 0 || profileSpecialty || displayPastJobs.length > 0) && (
              <div className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase size={13} className="text-muted-foreground" />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {isSpanish ? "Experiencia" : "Experience"}
                  </p>
                </div>
                {profileYearsExp > 0 && (
                  <p className="text-sm text-foreground mb-2">
                    <span className="font-bold text-purple-400">{profileYearsExp}</span>{" "}
                    {isSpanish ? "años de experiencia" : "years of experience"}
                    {profileSpecialty && (
                      <> — <span className="font-semibold text-orange-400">{profileSpecialty}</span></>
                    )}
                  </p>
                )}
                {displayPastJobs.length > 0 && (
                  <div className="space-y-1.5">
                    {displayPastJobs.map((job, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        <span className="text-sm text-foreground font-medium">{job.place}</span>
                        {job.role && (
                          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full border border-border">
                            {job.role}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {skills.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  {isSpanish ? "Habilidades" : "Skills & Roles"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <span key={s} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/30">
                      {SKILLS.find((sk) => sk.value === s)?.label ?? s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Location */}
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

        {/* Recent Reviews */}
        {profile?.id && <RecentReviews userId={profile.id} onViewAll={() => navigate("/ratings")} />}

        {/* Employer credits */}
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

        {/* Worker compliance */}
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

        {/* Logout */}
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